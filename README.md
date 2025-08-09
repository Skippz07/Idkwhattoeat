# IDK What To Eat - Restaurant Recommendation Website

A modern, interactive website that helps users decide where to eat by finding restaurants based on their location and preferences, then using spinning wheels to make the final decision.

## 🌟 Features

### 📍 Location Detection
- Automatic GPS location detection
- Manual location input option
- Address reverse geocoding
- Fallback to default location if GPS fails

### 🎯 Smart Filtering
- **Distance Filter**: 1-25 miles radius
- **Rating Filter**: Minimum star rating (3+, 3.5+, 4+, 4.5+)
- **Reviews Filter**: Minimum number of reviews (10+, 50+, 100+, 500+)
- **Food Type Filter**: Multiple cuisine types selection

### 🎲 Interactive Spinning Wheels
- **Food Type Wheel**: Spins to randomly select a cuisine type
- **Restaurant Wheel**: Spins to randomly select from filtered restaurants
- Smooth animations and visual feedback

### 🍽️ Restaurant Information
- Restaurant name, rating, and review count
- Distance from user location
- Food types and categories
- Contact information (address, phone)
- Beautiful card-based layout

### 🎨 Modern UI/UX
- Responsive design for all devices
- Beautiful gradient backgrounds
- Smooth animations and transitions
- Intuitive user interface
- Loading states and feedback

## 🚀 Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- Internet connection for location services and API calls
- GPS access (optional, for location detection)
- Google Maps API key (for real restaurant data)

### Installation
1. Clone or download this repository
2. Get a Google Maps API key (see setup instructions below)
3. For local development: Copy `config.example.js` to `config.js` and add your API key
4. Open `index.html` in your web browser
5. Allow location access when prompted
6. Start exploring restaurants!

### File Structure
```
IDKwhattoeat/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Styles and animations
├── js/
│   └── app.js          # Main JavaScript functionality
├── api/
│   └── config.js       # Vercel serverless function for API key
├── config.js           # Local development config (not in git)
├── config.example.js   # Example config file
├── vercel.json         # Vercel deployment configuration
└── README.md           # This file
```

## 🚀 Deploying to Vercel

### Option 1: GitHub + Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin master
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign up/login
   - Click "New Project" → Import your GitHub repository
   - Configure environment variables (see below)
   - Deploy automatically

### Option 2: Direct Upload

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project" → "Upload"
3. Drag your entire project folder
4. Configure environment variables (see below)
5. Deploy

### Environment Variables Setup

**Important**: You need to set up environment variables in Vercel for the Google Maps API key to work.

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Click on "Environment Variables"
   - Add a new variable:
     - **Name**: `GOOGLE_MAPS_API_KEY`
     - **Value**: Your Google Maps API key (e.g., `1234`)
     - **Environment**: Production, Preview, Development (select all)

2. **Redeploy:**
   - After adding the environment variable, redeploy your project
   - Go to "Deployments" → Click "Redeploy" on your latest deployment

### Local Development vs Production

- **Local Development**: Uses `config.js` file (not committed to git)
- **Production (Vercel)**: Uses environment variable `GOOGLE_MAPS_API_KEY`

## 🔑 Google Places API Setup

### Why Google Places API?
- **Real Restaurant Data**: Access to over 200 million places worldwide
- **Accurate Information**: Real ratings, reviews, addresses, and phone numbers
- **Comprehensive Coverage**: Includes restaurants, cafes, bars, and more
- **Rich Details**: Photos, opening hours, website links, and more
- **Free Tier**: $200 free credit monthly (approximately 28,500 requests)

### Step-by-Step Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable billing (required for API usage)

2. **Enable Places API**
   - In Google Cloud Console, go to "APIs & Services" > "Library"
   - Search for "Places API"
   - Click "Enable"

3. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

4. **Secure Your API Key** (Recommended)
   - Click on your API key to edit
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `localhost`, `yourdomain.com`)
   - Under "API restrictions", select "Restrict key"
   - Choose "Places API" from the list

5. **Configure Your API Key**
   - Copy `config.example.js` to `config.js`
   - Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key:
   ```javascript
   const config = {
       googleMaps: {
           apiKey: 'YOUR_ACTUAL_API_KEY_HERE', // Replace with your actual API key
           libraries: ['places']
       }
   };
   ```

### API Usage Limits
- **Free Tier**: $200 credit monthly
- **Places API**: ~$0.007 per request
- **Estimated Requests**: ~28,500 requests per month free
- **Rate Limits**: 100 requests per 100 seconds per user

### Error Handling
The application now includes comprehensive error handling:
- **API Key Issues**: Clear messages when API key is missing or invalid
- **Quota Exceeded**: Informative messages when API limits are reached
- **No Results**: Helpful suggestions when no restaurants are found
- **Network Issues**: User-friendly messages for connectivity problems

### Security Notes
- The `config.js` file is automatically ignored by Git (see `.gitignore`)
- Never commit your actual API keys to version control
- Use the `config.example.js` file as a template
- Consider using environment variables for production deployments

## 🎯 How to Use

### Step 1: Get Your Location
1. Click the "Get My Location" button
2. Allow location access in your browser
3. Your coordinates and address will be displayed

### Step 2: Set Your Preferences
1. **Distance**: Use the slider to set your preferred radius (1-25 miles)
2. **Rating**: Select minimum star rating from the dropdown
3. **Reviews**: Choose minimum number of reviews
4. **Food Types**: Click on food types you're interested in (optional)

### Step 3: Find Restaurants
1. Click "Find Restaurants" to search
2. Wait for the search to complete
3. Browse through the results

### Step 4: Spin the Wheels
1. **Food Type Wheel**: Click "Spin for Food Type" to randomly select a cuisine
2. **Restaurant Wheel**: Click "Spin for Restaurant" to randomly select a restaurant
3. View the selected restaurant's details

## 🔧 Technical Details

### Technologies Used
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with gradients, animations, and responsive design
- **JavaScript (ES6+)**: Interactive functionality and API integration
- **Google Maps API**: Real restaurant data and location services
- **Font Awesome**: Icons for better UX
- **Google Fonts**: Typography (Poppins)

### APIs and Services
- **Geolocation API**: Browser-based location detection
- **OpenStreetMap Nominatim**: Reverse geocoding for addresses
- **Google Places API**: Real restaurant information and search
- **Mock Restaurant Data**: Fallback data when API is unavailable

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🎨 Customization

### Adding New Food Types
Edit the `foodTypes` array in `js/app.js`:
```javascript
const foodTypes = [
    'Italian', 'Chinese', 'Mexican', 'Japanese', 'Indian', 'Thai',
    // Add your new food types here
];
```

### Modifying Styling
- Edit `css/style.css` to change colors, fonts, and layout
- Main color scheme uses purple gradients (`#667eea` to `#764ba2`)
- Responsive breakpoints at 768px and 480px

### API Configuration
The app automatically uses Google Places API when available. To modify API behavior:
- Edit the `simulateRestaurantSearch` function in `js/app.js`
- Adjust search parameters like radius, types, and ranking
- Modify the `extractFoodTypesFromGooglePlace` function for custom food type mapping

## 🐛 Troubleshooting

### Location Not Working
- Ensure your browser supports geolocation
- Check if location services are enabled
- Try refreshing the page
- The app will use a default location if GPS fails

### No Restaurants Found
- Try increasing the distance radius
- Lower the minimum rating requirement
- Reduce the minimum reviews filter
- Select different food types
- Check if Google Places API is properly configured

### Google Places API Issues
- Verify your API key is correct in `config.js`
- Check if Places API is enabled in Google Cloud Console
- Ensure billing is set up for your Google Cloud project
- Check API usage limits and quotas
- Review browser console for error messages

### Configuration Issues
- Ensure `config.js` exists and contains your API key
- Copy `config.example.js` to `config.js` if the file doesn't exist
- Verify the API key format is correct (no extra spaces or characters)
- Check that `config.js` is not being ignored by your web server

### Common Error Messages
- **"Google Maps API key is missing or invalid"**: Check your `config.js` file
- **"Access to Google Places API was denied"**: Verify API key and billing setup
- **"Google Places API quota exceeded"**: Wait and try again later
- **"No restaurants found in your area"**: Increase search radius
- **"No restaurants found matching your criteria"**: Adjust filters

### Spinning Wheel Issues
- Ensure JavaScript is enabled
- Refresh the page if animations don't work
- Check browser console for errors

## 📱 Mobile Usage

The website is fully responsive and works great on mobile devices:
- Touch-friendly interface
- Optimized for small screens
- Swipe gestures supported
- Fast loading times

## 🔒 Privacy

- Location data is only used for restaurant search
- No personal information is stored
- All data is processed locally
- No tracking or analytics
- Google Places API usage follows Google's privacy policy

## 🤝 Contributing

Feel free to contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Icons by Font Awesome
- Fonts by Google Fonts
- Restaurant data powered by Google Places API
- Design inspiration from modern web trends

---

**Enjoy your meal! 🍽️**
