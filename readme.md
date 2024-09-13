# VideoTube Backend

This repository contains the backend services for a video sharing-like application. It provides various functionalities such as user authentication, video management, and more.

[Postman Testing](https://www.postman.com/science-geologist-77290036/workspace/personal-project/request/36246570-f7d69e4d-5128-4cec-abad-65fc28d2fb70)

## Data Model
![data model](https://github.com/user-attachments/assets/6455d750-0035-4c3e-9799-8308bb05889f)

## Table of Contents

- [Getting Started](#getting-started)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup](#setup)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [Contact](#contact)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js
- npm (Node Package Manager)
- MongoDB
- Cloudinary

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/rishabhagg7/Learning-Backend.git
   cd Learning-Backend/youtube-backend
   ```

2. Install NPM packages:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```
   PORT=8000
   MONGODB_URI=YOUR_MONGODB_CONNECTION_URL_HAVING_CREDENTIALS
   CORS_ORIGIN=*
   ACCESS_TOKEN_SECRET=ANY_RANDOM_STRING
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=ANY_RANDOM_STRING
   REFRESH_TOKEN_EXPIRY=10d
   CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
   CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API
   CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET
   ```

4. Start the server:
   ```
   npm run dev
   ```

## Features

- User Authentication
- User Channel Dashboard
- Subscribers and Subscribed channels management
- Video management
- Commenting on Videos
- Tweet functionality for user channel
- Liking Videos, Comments & Tweets
- View counts, watch history & playlist functionality
- Searching for Videos with filters

## Technologies Used

- Node.js
- Express.js
- MongoDB
- JWT (JSON Web Token) for Authentication
- Multer for File operations
- Cloudinary as cloud storage for images and videos
- Bcrypt for encrypting and decrypting passwords
- Nodemon & prettier for development purpose only

## Setup

Follow the steps in the [Getting Started](#getting-started) section to set up the project.

## Usage

### Running the Application

To run the application locally, execute:

```
npm run dev
```

The server will start on `http://localhost:8000`.

### API Endpoints

Here's a list of the main API endpoints:

#### Health check

- `GET /api/v1/healthCheck`: Get health status of the server 

#### Authentication

- `POST /api/v1/users/register`: Register a new user
- `POST /api/v1/users/login`: Log in an existing user
- `POST /api/v1/users/logout`: Log out the current user
- `POST /api/v1/users/refresh-token`: Create a new refresh token
- `POST /api/v1/users/change-password`: Change existing password

#### Users

- `GET /api/v1/users/current-user`: Get details of current logged in user
- `GET /api/v1/users/history`: Get watch history of current logged in user
- `GET /api/v1/users/c/:username`: Get channel profile of an user by ID
- `PATCH /api/v1/users/update-account`: Update account details of current logged in user
- `PATCH /api/v1/users/update-avatar`: Update current logged in user's avatar
- `PATCH /api/v1/users/update-cover-image`: Update current logged in user's channel's thumbnail

#### Subscriptions

- `POST /api/v1/subscriptions/c/:channelId`: Toggle subscription of a channel by channel ID by current logged in user
- `GET /api/v1/subscriptions/c/:channelId`: Get subscriber list of a channel by channel ID
- `GET /api/v1/subscriptions/u/:subscriberId`: Get channel list of a user by subscriber ID(which is the user id)

#### Videos

- `GET /api/v1/videos/get-all-videos`: Get a list of all videos uploaded by an user, By default page = 1, limit = 10, sortType = "createdAt",  sortBy = "asc", "desc" for descending order
- `GET /api/v1/videos/v/:videoId`: Get video by ID
- `PATCH /api/v1/videos/v/:videoId`: Update video's thumbnail uploaded by current logged in user by video ID
- `DELETE /api/v1/videos/v/:videoId`: Delete video uploaded by current logged in user by video ID
- `POST /api/v1/videos/upload-video`: Upload a new video
- `PATCH /api/v1/videos/toggle-status/:videoId`: Toggle publish status of a video uploaded for current logged in user by video ID

#### Video views

- `GET /api/v1/views/:videoId`: Get total views on a video by video ID
- `POST /api/v1/views/:videoId`: Add a view on a video for current logged in user

#### Comments

- `POST /api/v1/comments/:videoId`: Add a comment to a video by video ID by current logged in user
- `GET /api/v1/comments/:videoId`: Get a list of comments on a video by video ID, By default page = 1, limit = 10
- `PATCH /api/v1/comments/:videoId`: Update comment on a video by video ID of current logged in user
- `DELETE /api/comments/:id`: Delete comment on a video by video ID of current logged in user

#### Playlists

- `POST /api/v1/playlists/`: Create a playlist for current logged in user
- `GET /api/v1/playlists/:playlistId`: Get a playlist of current logged in user by playlist ID
- `PATCH /api/v1/playlists/:playlistId`: Update a playlist of current logged in user by playlist ID
- `DELETE /api/v1/playlists/:playlistId`: Delete a playlist of current logged in user by playlist ID
- `PATCH /api/v1/playlists/add/:videoId/:playlistId`: Add a video to a playlist of current logged in user by video ID and playlist ID
- `PATCH /api/v1/playlists/remove/:videoId/:playlistId`: Remove a video in a playlist of current logged in user by video ID and playlist ID
- `GET /api/v1/playlists/user/:userId`: Get a list of video IDs of a playlist of current logged by playlist ID

#### Tweets

- `POST /api/v1/tweets/create`: Add a tweet by current logged in user
- `GET /api/v1/tweets/:tweetId`: Get a tweet by tweet ID
- `PATCH /api/v1/tweets/:tweetId`: Update a tweet by tweet ID of current logged in user
- `PATCH /api/v1/tweets/:tweetId`: Update a tweet by tweet ID of current logged in user
- `DELETE /api/v1/tweets/:videoId`: Delete a tweet by tweet ID of current logged in user
- `GET /api/v1/tweets/user/:userId`: Get a list of tweets by user ID

#### Likes

- `POST /api/v1/likes/toggle/v/:videoId`: Toggle like on a video by current logged in user by video ID
- `POST /api/v1/likes/toggle/c/:commentId`: Toggle like on a comment by current logged in user by comment ID
- `POST /api/v1/likes/toggle/t/:tweetId`: Toggle like on a tweet by current logged in user by tweet ID
- `GET /api/v1/likes/count/v/:videoId`: Get like count on a video by video ID
- `GET /api/v1/likes/count/c/:commentId`: Toggle like count on a comment by comment ID
- `GET /api/v1/likes/count/t/:tweetId`: Toggle like count on a tweet by tweet ID
- `GET /api/v1/likes/videos`: Get a list of video IDs of videos liked by current logged in user

#### Dashboard

- `GET /api/v1/dashboard/video/:channelId`: Get a list of all video IDs uploaded on a channel by channel ID
- `GET /api/v1/dashboard/stats/:channelId`: Get channel stats by channel ID

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## Contact

Rishabh Aggarwal - [code.rishabh712@gmail.com] - [https://www.linkedin.com/in/rishabh-aggarwal-32942a222/]

Project Link: [https://github.com/rishabhagg7/Learning-Backend/tree/main/youtube-backend](https://github.com/rishabhagg7/Learning-Backend/tree/main/youtube-backend)
