# BuildForGood-Server Side

## models
All made in mongoose (mongoDB, on aws).
The models are: User, Profile, Hobbie and Content.
all in models dir.

## routes
Managed with Express.
This are the routes and their actions:
1. users - Create user
2. profiles - Create a new user, Get current user profile, get all profiles, Get profile by user id, Delete a profile - also deletes its user.
3. hobbies - Get all hobbies, Create new hobbie (meant only for admin).
4. contents - Create, Get all, Get by user id, Get by hobbie, Delete, Like, Unlike, Comment, Delete comment.
