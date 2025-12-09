module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    'public/js/**/*.js',
    '!src/server.js', // Exclude main server file from coverage
    '!**/node_modules/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '**/tests/unit/server.test.js',
        '**/tests/unit/uploadController.test.js',
        '**/tests/unit/processController.test.js',
        '**/tests/unit/processController.property.test.js',
        '**/tests/unit/downloadController.test.js',
        '**/tests/unit/downloadController.property.test.js',
        '**/tests/unit/infoController.property.test.js',
        '**/tests/unit/fileManager.test.js',
        '**/tests/unit/pythonService.test.js',
        '**/tests/unit/pythonService.property.test.js',
        '**/tests/unit/errorHandling.property.test.js',
        '**/tests/unit/cleanup.test.js'
      ]
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: [
        '**/tests/unit/audioRecorder.test.js',
        '**/tests/unit/audioRecorder.property.test.js',
        '**/tests/unit/apiClient.test.js',
        '**/tests/unit/uiController.test.js',
        '**/tests/unit/uiController.property.test.js',
        '**/tests/unit/audioPlayer.test.js',
        '**/tests/unit/tooltip.property.test.js'
      ]
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: [
        '**/tests/integration/**/*.test.js'
      ]
    }
  ]
};
