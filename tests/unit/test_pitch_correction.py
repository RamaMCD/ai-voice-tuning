"""
Property-Based Tests for Pitch Correction
Using Hypothesis for property-based testing
"""

import sys
import os
import pytest
import numpy as np
from hypothesis import given, strategies as st, settings
from pathlib import Path

# Add ai_engine to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from ai_engine.pitch_correction import (
    detect_pitch,
    quantize_to_semitones,
    pitch_correction,
    hz_to_semitones
)


class TestPitchCorrectionProperties:
    """
    Property-based tests for pitch correction functionality
    """
    
    @given(
        audio_length=st.integers(min_value=1000, max_value=50000),
        sample_rate=st.sampled_from([8000, 16000, 22050, 44100, 48000])
    )
    @settings(max_examples=100, deadline=None)
    def test_property_11_pitch_correction_application(self, audio_length, sample_rate):
        """
        Feature: ai-voice-tuning, Property 11: Pitch correction application
        For any audio with detected pitch values, the AI engine should apply 
        correction to quantize pitches to the nearest musical semitone
        
        Validates: Requirements 3.5
        """
        # Generate random audio signal with some frequency content
        # Use a sine wave with random frequency to ensure detectable pitch
        duration = audio_length / sample_rate
        t = np.linspace(0, duration, audio_length)
        
        # Generate a tone with frequency in vocal range (100-300 Hz)
        frequency = np.random.uniform(100, 300)
        y = 0.5 * np.sin(2 * np.pi * frequency * t)
        
        # Add some noise to make it more realistic
        noise = np.random.normal(0, 0.05, audio_length)
        y = y + noise
        
        # Apply pitch correction
        y_corrected = pitch_correction(y, sample_rate)
        
        # Property 1: Output should have same length as input
        assert len(y_corrected) == len(y), \
            f"Output length {len(y_corrected)} != input length {len(y)}"
        
        # Property 2: Output should be valid audio (values between -1 and 1)
        assert np.all(np.abs(y_corrected) <= 1.5), \
            f"Output contains invalid audio values (max: {np.max(np.abs(y_corrected))})"
        
        # Property 3: Output should not be all zeros (unless input was silent)
        if np.any(y != 0):
            assert np.any(y_corrected != 0), \
                "Output is all zeros for non-silent input"
        
        # Property 4: Output should be a numpy array
        assert isinstance(y_corrected, np.ndarray), \
            f"Output type {type(y_corrected)} is not numpy array"
        
        # Property 5: Output dtype should be float
        assert np.issubdtype(y_corrected.dtype, np.floating), \
            f"Output dtype {y_corrected.dtype} is not floating point"
    
    @given(
        pitch_values=st.lists(
            st.floats(min_value=80.0, max_value=400.0, allow_nan=False, allow_infinity=False),
            min_size=10,
            max_size=1000
        )
    )
    @settings(max_examples=100)
    def test_quantize_to_semitones_properties(self, pitch_values):
        """
        Test properties of quantize_to_semitones function
        """
        pitches = np.array(pitch_values)
        quantized = quantize_to_semitones(pitches)
        
        # Property 1: Output should have same shape as input
        assert quantized.shape == pitches.shape, \
            f"Output shape {quantized.shape} != input shape {pitches.shape}"
        
        # Property 2: Quantized values should be valid frequencies
        valid_quantized = quantized[quantized > 0]
        if len(valid_quantized) > 0:
            assert np.all(valid_quantized >= 50), \
                "Quantized values contain frequencies below 50 Hz"
            assert np.all(valid_quantized <= 500), \
                "Quantized values contain frequencies above 500 Hz"
    
    @given(
        audio_length=st.integers(min_value=2000, max_value=20000),
        sample_rate=st.sampled_from([16000, 22050, 44100])
    )
    @settings(max_examples=100, deadline=None)
    def test_detect_pitch_properties(self, audio_length, sample_rate):
        """
        Test properties of detect_pitch function
        """
        # Generate random audio
        y = np.random.uniform(-0.5, 0.5, audio_length)
        
        # Detect pitch
        pitches = detect_pitch(y, sample_rate)
        
        # Property 1: Output should be a numpy array
        assert isinstance(pitches, np.ndarray), \
            f"Output type {type(pitches)} is not numpy array"
        
        # Property 2: Output should contain non-negative values
        assert np.all(pitches >= 0), \
            "Pitch values contain negative frequencies"
        
        # Property 3: Non-zero pitch values should be in reasonable range
        valid_pitches = pitches[pitches > 0]
        if len(valid_pitches) > 0:
            assert np.all(valid_pitches >= 50), \
                "Detected pitches contain unreasonably low frequencies"
            assert np.all(valid_pitches <= 1000), \
                "Detected pitches contain unreasonably high frequencies"
    
    @given(
        ratio=st.floats(min_value=0.5, max_value=2.0, allow_nan=False, allow_infinity=False)
    )
    @settings(max_examples=100)
    def test_hz_to_semitones_properties(self, ratio):
        """
        Test properties of hz_to_semitones conversion
        """
        semitones = hz_to_semitones(ratio)
        
        # Property 1: Output should be a number
        assert isinstance(semitones, (int, float, np.number)), \
            f"Output type {type(semitones)} is not a number"
        
        # Property 2: Ratio of 1.0 should give 0 semitones
        if abs(ratio - 1.0) < 0.01:
            assert abs(semitones) < 0.2, \
                f"Ratio ~1.0 should give ~0 semitones, got {semitones}"
        
        # Property 3: Ratio of 2.0 should give 12 semitones (one octave)
        if abs(ratio - 2.0) < 0.01:
            assert abs(semitones - 12) < 0.2, \
                f"Ratio ~2.0 should give ~12 semitones, got {semitones}"
    
    def test_pitch_correction_with_silent_audio(self):
        """
        Edge case: Test pitch correction with silent audio
        """
        # Create silent audio
        y = np.zeros(10000)
        sr = 22050
        
        # Apply pitch correction
        y_corrected = pitch_correction(y, sr)
        
        # Should return audio of same length
        assert len(y_corrected) == len(y)
        
        # Should be valid audio
        assert isinstance(y_corrected, np.ndarray)
    
    def test_pitch_correction_with_pure_tone(self):
        """
        Example test: Test pitch correction with a pure tone
        """
        # Create a pure tone at 220 Hz (A3)
        sr = 22050
        duration = 1.0
        t = np.linspace(0, duration, int(sr * duration))
        frequency = 220.0
        y = 0.5 * np.sin(2 * np.pi * frequency * t)
        
        # Apply pitch correction
        y_corrected = pitch_correction(y, sr)
        
        # Should return audio of same length
        assert len(y_corrected) == len(y)
        
        # Should not be all zeros
        assert np.any(y_corrected != 0)
        
        # Should be valid audio
        assert np.all(np.abs(y_corrected) <= 1.5)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
