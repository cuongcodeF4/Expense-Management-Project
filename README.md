# Expense Management Project

A cross-platform solution for managing personal expenses, featuring both an Android mobile app and a web application. This project is designed to help users track, categorize, and analyze their expenses efficiently. This is a product from vibe coding :>
 
## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)

## Features
- Add, edit, and delete expenses
- Categorize expenses for better tracking
- View expense summaries and analytics
- Cross-platform support: Android app and web app
- Secure authentication and data storage

## Project Structure
```
Expense-Management-Project/
├── Android-App/      # Native Android application (Kotlin)
│   └── app/
│       └── src/
│           └── main/
├── Web-App/          # Web application (likely JavaScript/TypeScript)
│   └── public/
│       └── assets/
└── README.md         # Project documentation
```

## Getting Started

### Prerequisites
- [Android Studio](https://developer.android.com/studio) for Android development
- [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) for web development
- [Firebase CLI](https://firebase.google.com/docs/cli) for deploying the web app (if using Firebase)

### Android App
1. Open `Android-App` in Android Studio.
2. Sync Gradle and build the project.
3. Run the app on an emulator or physical device by connect USB with Android phone with enable USB debugging mode.

### Web App
1. Navigate to the `Web-App` directory:
	```sh
	cd Web-App
	```
2. Install dependencies:
	```sh
	npm install
	```
3. Start the development server:
	```sh
	npm start
	```
4. For deployment, use Firebase CLI or your preferred hosting service.
    Local deployment:
    ```sh
    firebase serve
    ```
    Release deployment:
    ```sh
    firebase deploy --force
    ```
    **Note:** 
    - After deployment, on the web app, "ctrl + shift + r" to clear cache and load the latest version.
    - For phone web, you may need to clear the browser cache to see the latest changes.

## Technologies Used
- **Android App:** Kotlin, Android SDK, Gradle
- **Web App:** JavaScript/TypeScript, HTML, CSS, Firebase (for hosting and database)

## Contributing
Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
