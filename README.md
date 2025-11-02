# ExamCloud
ExamCloud is a modern, feature-rich online examination platform that enables educators to create, manage, and distribute multiple-choice exams with advanced security features and real-time monitoring.

## Full Description
ExamCloud is a comprehensive web-based examination system designed for educational institutions and individual educators. It provides a secure environment for creating and administering multiple-choice exams with robust anti-cheating measures, real-time monitoring, and detailed analytics. The platform features a beautiful, responsive interface with gradient designs and smooth animations, making the exam experience pleasant for both educators and students.

The system includes separate interfaces for teachers (exam creation and result analysis) and students (exam taking), with secure authentication, exam timing, cheating detection, and PDF result generation capabilities.

## All Features

### Authentication & Security
- Secure user registration and login system
- Password visibility toggle
- Session management with local storage
- Automatic redirection based on authentication status

### Exam Creation & Management
- **Dual Input Modes**: 
  - Manual question entry with rich text areas
  - JSON file upload for bulk question import
- Flexible exam configuration (title, duration, questions)
- Real-time question preview
- Question management (add, remove, edit)
- Option-based correct answer selection

### Student Exam Interface
- Clean, distraction-free exam environment
- Real-time countdown timer with overlay
- One-question-per-page layout
- Answer selection with visual feedback
- Automatic submission on time expiration

### Advanced Anti-Cheating System
- Tab switching detection
- Window focus monitoring
- Copy/paste prevention
- Right-click disable
- Keyboard event monitoring
- Container visibility detection
- Progressive warning system (3-strike policy)
- Automatic submission on repeated violations

### Results & Analytics
- Comprehensive result dashboard
- Score calculation with percentage
- Performance rating system
- Cheating attempt tracking
- Student answer comparison
- Detailed explanation display
- PDF report generation
- Filtering and search capabilities

### Sharing & Distribution
- Automatic URL shortening with TinyURL
- Exam link copying
- Direct preview functionality
- Secure exam access via unique IDs

### User Experience
- Responsive design for all devices
- Beautiful gradient themes
- Smooth animations and transitions
- Toast notifications system
- Modal confirmations
- Loading states and progress indicators

## How it Works?

### Architecture Overview
ExamCloud follows a client-server architecture with Supabase as the backend service. The application is structured into four main components:

1. **Authentication Module** (`auth.html`): Handles user registration and login
2. **Teacher Dashboard** (`index.html`): Exam creation and management interface
3. **Student Exam Interface** (`exam.html`): Secure exam-taking environment
4. **Results Dashboard** (`results.html`): Performance analytics and reporting

### Data Flow
1. **Teachers** create exams through the dashboard interface
2. Exams are stored in Supabase database with unique IDs
3. **Students** access exams via shared links
4. During exams, cheating detection runs continuously
5. Results are automatically saved and available for teacher review
6. PDF reports can be generated for individual or batch results

### Security Mechanism
The anti-cheating system employs multiple detection layers:
- Visibility API for tab/window monitoring
- Event listeners for user interactions
- Intersection Observer for container visibility
- Progressive penalty system with warnings

## Functions

### Core Functions
- **User Authentication**: Secure signup/login with email verification
- **Exam Creation**: Build exams with questions, options, and explanations
- **Exam Distribution**: Generate and share exam links
- **Exam Taking**: Secure interface with timer and monitoring
- **Result Processing**: Automatic scoring and analytics
- **Report Generation**: PDF creation for results

### Technical Functions
- **Real-time Validation**: Form validation and error handling
- **State Management**: Local storage for user sessions
- **API Integration**: Supabase for data persistence
- **URL Shortening**: Integration with TinyURL service
- **PDF Generation**: Client-side PDF creation with html2pdf
- **Responsive Design**: Mobile-first responsive layouts

### Security Functions
- **Input Sanitization**: XSS prevention through HTML escaping
- **Authentication Guards**: Route protection based on user roles
- **Cheating Detection**: Multi-layered monitoring system
- **Data Encryption**: Secure data transmission

## Usage & Installation

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Supabase account for backend services
- Web server for hosting (optional for local development)

### Installation Steps

1. **Clone or Download the Project**
   # If using git
- git clone https://github.com/cloudxplorer/ExamCloud
- cd ExamCloud
- python -m http.server 4444

Now open your modern Web browser and visit the link given below

- https://localhost:4444

DEMO:- [ExamCloud](https://cloudxplorer.github.io/ExamCloud/)

## Usage Guide

### For Teachers:

1. **Register/Login to your account**
2. **Create exams using manual input or JSON upload**
3. **Configure exam title and duration**
4. **Generate shareable links**
5. **Monitor results in the dashboard**
6. **Download PDF reports**

### For Students:

1. **Click on the shared exam link**
2. **Enter your name to start the exam**
3. **Complete the exam within the time limit**
4. **View immediate results with explanations**
5. **Download your result as PDF**

## Tech Stack

### Frontend Technologies
- **HTML5**: Semantic markup structure
- **CSS3**: Advanced styling with CSS variables and gradients
- **JavaScript ES6+**: Modern JavaScript with async/await
- **Supabase JS Client**: Backend-as-a-Service integration

### Backend & Services
- **Supabase**: Authentication and database services
- **TinyURL API**: URL shortening service

### Libraries & Tools
- **html2pdf.js**: Client-side PDF generation
- **Supabase JavaScript Client**: Database operations
- **Modern CSS Features**: Grid, Flexbox, CSS Variables

### Key Technical Features
- **Responsive Design**: Mobile-first responsive layout
- **Progressive Web App**: Offline-capable features
- **Real-time Updates**: Live data synchronization
- **Security First**: Comprehensive input validation and XSS protection

## License
This project is proprietary software. All rights reserved. The source code is provided for educational and evaluation purposes. Redistribution or commercial use without permission is prohibited.
   
