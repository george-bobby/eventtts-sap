# 🎯 Event Management Platform

A comprehensive, AI-powered event management platform designed for organizations to create, manage, and attend events with advanced features like QR code ticketing, AI task generation, location prediction, photo galleries, and automated certificate generation.

![Event Platform](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-blue) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC) ![MongoDB](https://img.shields.io/badge/MongoDB-47A248) ![AI Powered](https://img.shields.io/badge/AI-Powered-orange)

## 🌟 Key Features

### 📅 **Event Management**

- **Create & Manage Events**: Comprehensive event creation with detailed information, tags, categories, and sub-events
- **Campus Integration**: Built-in campus location mapping and navigation
- **Event Discovery**: AI-powered recommendation system for personalized event suggestions
- **Interactive Event Dashboard**: Real-time analytics and management tools for organizers
- **Event Updates**: Real-time communication system for event updates and announcements

### 🤖 **AI-Powered Features**

- **Smart Task Generation**: AI-generated planning tasks using Google Gemini API based on event type and details
- **Location Prediction**: Hybrid AI + GPS system for predicting campus locations from photos
- **Automated Reports**: AI-generated comprehensive event reports with insights and analytics
- **Intelligent Recommendations**: Personalized event suggestions based on user preferences

### 🎫 **Advanced Ticketing System**

- **QR Code Generation**: Automated QR code generation for all ticket holders
- **Ticket Verification**: Real-time ticket scanning and validation system
- **Multiple Ticket Types**: Support for free and paid events with various pricing tiers
- **Attendance Tracking**: Real-time attendance monitoring and analytics
- **Digital Tickets**: Mobile-friendly digital tickets with secure verification

### 📸 **Photo Gallery Management**

- **Multi-Gallery Support**: Create multiple galleries per event with different access levels
- **Access Control**: Public, private, and password-protected galleries
- **Photo Upload**: Bulk photo uploads with metadata support
- **Comments & Interaction**: Photo commenting system with moderation
- **Download Management**: Configurable photo download permissions

### 🏆 **Certificate System**

- **Template Management**: Custom certificate templates with dynamic fields
- **Automated Generation**: Bulk certificate generation for stakeholders
- **Email Distribution**: Automated certificate delivery via email
- **Multiple Formats**: Support for PDF certificates with customizable designs
- **Stakeholder Management**: Role-based certificate generation (participants, organizers, speakers)

### 📊 **Analytics & Reporting**

- **Real-time Analytics**: Event performance metrics and attendance tracking
- **Financial Reports**: Revenue tracking and expenditure analysis
- **Feedback Analytics**: Comprehensive feedback collection and analysis
- **AI-Generated Reports**: Automated report generation with insights and recommendations
- **Export Capabilities**: Data export in multiple formats (PDF, Excel)

### 💬 **Communication Features**

- **Bulk Email System**: Mass communication with stakeholders
- **Event Updates**: Real-time notifications and announcements
- **Feedback Management**: Comprehensive feedback collection and management
- **Issue Tracking**: Built-in issue reporting and resolution system
- **Stakeholder Communication**: Multi-channel communication tools

### 🗺️ **Campus Integration**

- **Interactive Maps**: Campus location mapping with navigation
- **GPS Integration**: Location-based services and event discovery
- **Venue Management**: Campus venue booking and management
- **Location Services**: Smart location prediction and recommendations

## 🛠️ Tech Stack

### **Frontend**

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern UI components
- **Radix UI** - Accessible component primitives

### **Backend & Database**

- **Node.js** - JavaScript runtime
- **MongoDB** - NoSQL database with Mongoose ODM
- **NextAuth/Clerk** - Authentication and user management
- **Uploadthing** - File upload management

### **AI & ML**

- **Google Gemini API** - AI task generation and report creation
- **Roboflow** - Computer vision for location prediction
- **Hybrid Prediction System** - GPS + AI location detection

### **Integrations**

- **Stripe** - Payment processing for paid events
- **Resend** - Email service for notifications
- **QR Code Generation** - Ticket verification system
- **PDF Generation** - Certificate and report creation

### **Development Tools**

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **React Hook Form** - Form management
- **Zod** - Schema validation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database
- Required API keys (see Environment Variables)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/george-bobby/event-platform.git
cd event-platform
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

Fill in your environment variables:

```env
# Database
MONGODB_URI=your_mongodb_uri

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# AI Services
GEMINI_API_KEY=your_gemini_api_key
ROBOFLOW_API_KEY=your_roboflow_api_key

# Payment (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# File Upload
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# Email
RESEND_API_KEY=your_resend_api_key

# App URLs
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

4. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Key Pages & Features

### **Student/Attendee Features**

- **Home Page** (`/`) - Event discovery and recommendations
- **Explore Events** (`/explore`) - Browse and filter events
- **Event Details** (`/event/[id]`) - Detailed event information and registration
- **My Tickets** (`/event/[id]/ticket`) - View purchased tickets and QR codes
- **Dashboard** (`/dashboard`) - User dashboard and preferences
- **Event Gallery** (`/gallery/[id]`) - View event photos
- **Ticket Verification** (`/verify-ticket/[id]`) - QR code verification

### **Organizer Features**

- **Create Event** (`/create`) - Comprehensive event creation
- **Event Management** (`/event/[id]/manage`) - Complete event dashboard
- **AI Planning** (`/event/[id]/plan`) - AI-generated task management
- **Analytics** (`/event/[id]/analytics`) - Event performance metrics
- **Attendee Management** (`/event/[id]/attendees`) - Manage registrations
- **QR Code Management** (`/event/[id]/qr-code`) - Generate and manage tickets
- **Photo Gallery** (`/event/[id]/gallery`) - Manage event galleries
- **Certificates** (`/event/[id]/certificates`) - Generate and distribute certificates
- **Stakeholders** (`/event/[id]/stakeholders`) - Manage event stakeholders

### **Special Features**

- **Location Prediction** - AI-powered campus location detection
- **Event Updates** - Real-time event communication
- **Feedback System** - Comprehensive feedback collection
- **Report Generation** - AI-powered event reports

## 🔧 API Endpoints

### **Event Management**

- `POST /api/events` - Create event
- `GET /api/events` - List events
- `PUT /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event

### **AI Features**

- `POST /api/generate-tasks` - Generate AI planning tasks
- `POST /api/predict` - Location prediction
- `POST /api/reports` - Generate AI reports

### **Ticketing**

- `POST /api/qrcode/generate` - Generate QR codes
- `POST /api/qrcode/scan` - Scan and verify tickets
- `GET /api/qrcode/[eventId]` - Get event QR codes

### **Gallery**

- `POST /api/gallery` - Create photo gallery
- `POST /api/gallery/upload` - Upload photos
- `GET /api/gallery/[id]` - Get gallery photos

### **Certificates**

- `POST /api/certificates/generate` - Generate certificates
- `POST /api/certificates/bulk` - Bulk certificate generation
- `GET /api/certificates/[eventId]` - Get event certificates

### **Communications**

- `POST /api/communications` - Send bulk emails
- `POST /api/event-updates` - Create event updates
- `GET /api/feedback/[eventId]` - Get event feedback

## 🏗️ Project Structure

```
event-platform/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   ├── (root)/                   # Main application pages
│   ├── api/                      # API routes
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── certificates/             # Certificate management
│   ├── eventupdates/            # Event updates
│   ├── gallery/                 # Photo gallery
│   ├── qrcode/                  # QR code management
│   ├── shared/                  # Shared components
│   ├── stakeholders/            # Stakeholder management
│   └── ui/                      # UI components
├── lib/                         # Utilities and configurations
│   ├── actions/                 # Server actions
│   ├── email/                   # Email templates
│   ├── models/                  # MongoDB models
│   ├── utils/                   # Utility functions
│   └── constants/               # App constants
├── public/                      # Static assets
├── types/                       # TypeScript types
└── hooks/                       # Custom React hooks
```

## 🎨 Database Schema

### **Core Models**

- **Event** - Main event information with sub-events support
- **User** - User profiles and authentication
- **Order** - Ticket purchases and transactions
- **Category** - Event categorization
- **Tag** - Event tagging system

### **Advanced Features**

- **QRCode** - Ticket verification and tracking
- **PhotoGallery** - Event photo management
- **Photo** - Individual photo metadata
- **CertificateTemplate** - Certificate design templates
- **Certificate** - Generated certificates
- **Stakeholder** - Event participants and staff
- **EventUpdate** - Real-time event communications
- **Feedback** - Event feedback and ratings
- **Report** - AI-generated event reports

## 🔐 Security Features

- **JWT Authentication** - Secure user authentication
- **Role-based Access Control** - Granular permissions system
- **Data Validation** - Comprehensive input validation with Zod
- **Rate Limiting** - API rate limiting and abuse prevention
- **Secure File Upload** - Protected file upload with validation
- **Environment Variables** - Secure configuration management

## 🚀 Deployment

### **Vercel (Recommended)**

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Docker**

```bash
docker build -t event-platform .
docker run -p 3000:3000 event-platform
```

### **Manual Deployment**

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** - For intelligent task generation and reporting
- **Roboflow** - For computer vision capabilities
- **Shadcn/ui** - For beautiful UI components
- **Vercel** - For seamless deployment
- **MongoDB** - For robust database solutions

---

## 🌟 Star History

If you find this project helpful, please consider giving it a star on GitHub!

---

Made with ❤️ for the campus community
