module.exports = {
    testMatch: [
        "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
        "<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}",
        "<rootDir>/tests/**/*.{js,jsx,ts,tsx}"  // This line includes your tests directory
    ],
    testPathIgnorePatterns: ["/node_modules/"]
};
