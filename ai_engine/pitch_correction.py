"""
AI Voice Tuning - Pitch Correction Engine
Menggunakan librosa untuk deteksi dan koreksi pitch audio
"""

import sys
import os
import logging
import librosa
import soundfile as sf
import numpy as np
from pathlib import Path

# Set ffmpeg path for pydub if available
if os.getenv('FFMPEG_PATH'):
    os.environ['PATH'] = os.path.dirname(os.getenv('FFMPEG_PATH')) + os.pathsep + os.environ.get('PATH', '')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def detect_pitch(y, sr):
    """
    Deteksi pitch menggunakan librosa.piptrack
    
    Args:
        y: Audio time series
        sr: Sample rate
        
    Returns:
        Array of pitch values in Hz
    """
    try:
        # Gunakan piptrack untuk deteksi pitch
        pitches, magnitudes = librosa.piptrack(
            y=y,
            sr=sr,
            fmin=80,   # Minimum frequency (Hz) - lowest male voice
            fmax=400   # Maximum frequency (Hz) - highest female voice
        )
        
        # Extract pitch per frame
        pitch_values = []
        for t in range(pitches.shape[1]):
            index = magnitudes[:, t].argmax()
            pitch = pitches[index, t]
            pitch_values.append(pitch)
        
        return np.array(pitch_values)
    
    except Exception as e:
        logger.error(f"Error in detect_pitch: {str(e)}")
        raise


def quantize_to_semitones(pitches):
    """
    Quantize pitch values to nearest musical semitone
    
    Args:
        pitches: Array of pitch values in Hz
        
    Returns:
        Array of quantized pitch values in Hz
    """
    try:
        # Filter out zero/invalid pitches
        valid_pitches = pitches[pitches > 0]
        
        if len(valid_pitches) == 0:
            logger.warning("No valid pitches detected")
            return pitches
        
        # Convert Hz to MIDI note numbers
        midi_notes = librosa.hz_to_midi(valid_pitches)
        
        # Round to nearest semitone
        quantized_midi = np.round(midi_notes)
        
        # Convert back to Hz
        quantized_hz = librosa.midi_to_hz(quantized_midi)
        
        # Create result array with same shape as input
        result = np.zeros_like(pitches)
        result[pitches > 0] = quantized_hz
        
        return result
    
    except Exception as e:
        logger.error(f"Error in quantize_to_semitones: {str(e)}")
        raise


def hz_to_semitones(ratio):
    """
    Convert frequency ratio to semitones
    
    Args:
        ratio: Frequency ratio
        
    Returns:
        Number of semitones
    """
    if ratio <= 0:
        return 0
    return 12 * np.log2(ratio)


def pitch_correction(y, sr, correction_strength=0.8):
    """
    Koreksi pitch dengan time stretching dan pitch shift
    
    Args:
        y: Audio time series
        sr: Sample rate
        correction_strength: 0.0 (no correction) to 1.0 (full correction)
        
    Returns:
        Corrected audio time series
    """
    try:
        logger.info("Starting pitch correction...")
        
        # Detect pitch
        logger.info("Detecting pitch...")
        pitches = detect_pitch(y, sr)
        
        # Find target pitch (quantize to nearest semitone)
        logger.info("Quantizing to semitones...")
        target_pitches = quantize_to_semitones(pitches)
        
        # Calculate median pitch shift needed
        valid_original = pitches[pitches > 0]
        valid_target = target_pitches[pitches > 0]
        
        if len(valid_original) == 0:
            logger.warning("No valid pitches detected, returning original audio")
            return y
        
        # Calculate pitch shift ratio
        pitch_ratios = valid_target / (valid_original + 1e-10)
        pitch_shift_ratio = np.median(pitch_ratios)
        
        logger.info(f"Pitch shift ratio: {pitch_shift_ratio:.3f}")
        
        # Apply pitch shift only if ratio is reasonable
        if 0.5 < pitch_shift_ratio < 2.0:
            # Convert ratio to semitones
            n_steps = hz_to_semitones(pitch_shift_ratio)
            
            logger.info(f"Applying pitch shift of {n_steps:.2f} semitones...")
            
            # Apply pitch shift
            y_corrected = librosa.effects.pitch_shift(
                y=y,
                sr=sr,
                n_steps=n_steps
            )
            
            # Blend original and corrected based on correction strength
            y_result = (1 - correction_strength) * y + correction_strength * y_corrected
            
            logger.info("Pitch correction completed successfully")
            return y_result
        else:
            logger.warning(f"Pitch shift ratio {pitch_shift_ratio:.3f} is out of reasonable range, returning original")
            return y
    
    except Exception as e:
        logger.error(f"Error in pitch_correction: {str(e)}")
        raise


def generate_output_path(input_path):
    """
    Generate output path for tuned audio
    
    Args:
        input_path: Path to input audio file
        
    Returns:
        Path to output audio file
    """
    input_file = Path(input_path)
    output_dir = Path("outputs")
    
    # Create outputs directory if it doesn't exist
    output_dir.mkdir(exist_ok=True)
    
    # Always save output as WAV format regardless of input format
    output_filename = f"{input_file.stem}-tuned.wav"
    output_path = output_dir / output_filename
    
    return str(output_path)


def load_audio_robust(input_path):
    """
    Load audio file with multiple fallback methods
    
    Args:
        input_path: Path to input audio file
        
    Returns:
        Tuple of (audio_data, sample_rate)
    """
    # Method 1: Try librosa with soundfile backend (fastest, most reliable for WAV)
    try:
        logger.info("Attempting to load with librosa (soundfile backend)...")
        y, sr = librosa.load(input_path, sr=None, mono=True)
        logger.info(f"Successfully loaded with soundfile backend")
        return y, sr
    except Exception as e1:
        logger.warning(f"Soundfile backend failed: {str(e1)}")
        
        # Method 2: Try with scipy.io.wavfile for basic WAV files
        try:
            logger.info("Attempting to load with scipy.io.wavfile...")
            from scipy.io import wavfile
            sr, y = wavfile.read(input_path)
            
            # Convert to float and normalize
            if y.dtype == np.int16:
                y = y.astype(np.float32) / 32768.0
            elif y.dtype == np.int32:
                y = y.astype(np.float32) / 2147483648.0
            elif y.dtype == np.uint8:
                y = (y.astype(np.float32) - 128) / 128.0
            
            # Convert stereo to mono if needed
            if len(y.shape) > 1:
                y = y.mean(axis=1)
            
            logger.info(f"Successfully loaded with scipy.io.wavfile")
            return y, sr
        except Exception as e2:
            logger.warning(f"scipy.io.wavfile failed: {str(e2)}")
            
            # Method 3: Try audioread (requires ffmpeg but librosa will handle it)
            try:
                logger.info("Attempting to load with audioread backend...")
                import audioread
                y, sr = librosa.load(input_path, sr=None, mono=True)
                logger.info(f"Successfully loaded with audioread backend")
                return y, sr
            except Exception as e3:
                logger.error(f"All loading methods failed")
                error_msg = "File audio tidak bisa dibaca. File WebM memerlukan ffmpeg. Silakan install ffmpeg atau gunakan fitur Upload dengan file .wav/.mp3. Lihat INSTALL_FFMPEG.md untuk panduan instalasi."
                raise Exception(error_msg)


def main(input_path):
    """
    Main function untuk pitch correction
    
    Args:
        input_path: Path to input audio file
    """
    try:
        logger.info(f"Processing audio file: {input_path}")
        
        # Validate input file exists
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")
        
        # Load audio with robust fallback methods
        logger.info("Loading audio file...")
        y, sr = load_audio_robust(input_path)
        logger.info(f"Audio loaded: duration={len(y)/sr:.2f}s, sample_rate={sr}Hz")
        
        # Apply pitch correction
        y_corrected = pitch_correction(y, sr)
        
        # Generate output path
        output_path = generate_output_path(input_path)
        
        # Save output
        logger.info(f"Saving corrected audio to: {output_path}")
        sf.write(output_path, y_corrected, sr)
        
        # Return output path to stdout (untuk dibaca oleh Node.js)
        print(output_path)
        logger.info("Processing completed successfully")
        sys.exit(0)
    
    except FileNotFoundError as e:
        logger.error(f"File not found: {str(e)}")
        print(f"ERROR:FILE_NOT_FOUND:{str(e)}", file=sys.stderr)
        sys.exit(1)
    
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}")
        print(f"ERROR:PROCESSING_FAILED:{str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pitch_correction.py <input_file>", file=sys.stderr)
        print("ERROR:INVALID_ARGUMENTS:Missing input file path", file=sys.stderr)
        sys.exit(1)
    
    main(sys.argv[1])
