// recommendation.js

class OutfitRecommendationEngine {
 constructor() {
   // Color combinations that work well together
   this.colorCombinations = {
     'black': ['white', 'grey', 'red', 'blue', 'yellow', 'pink'],
     'white': ['black', 'blue', 'red', 'green', 'brown', 'grey'],
     'blue': ['white', 'black', 'grey', 'brown', 'yellow'],
     'grey': ['white', 'black', 'blue', 'red', 'pink'],
     'brown': ['white', 'cream', 'blue', 'green', 'orange'],
     'red': ['white', 'black', 'grey', 'blue'],
     'green': ['white', 'brown', 'cream', 'black'],
     'yellow': ['black', 'blue', 'white', 'grey'],
     'pink': ['white', 'black', 'grey', 'navy']
   };

   // Occasion-based outfit rules
   this.occasionRules = {
     'work': {
       formality: 'formal',
       avoid: ['shorts', 'flip-flops', 'crop-top'],
       prefer: ['shirt', 'blazer', 'trousers', 'dress-shoes']
     },
     'meeting': {
       formality: 'formal',
       avoid: ['casual-wear', 'bright-colors'],
       prefer: ['suit', 'formal-shirt', 'tie', 'dress-shoes']
     },
     'party': {
       formality: 'semi-formal',
       prefer: ['dress', 'heels', 'accessories', 'bright-colors']
     },
     'casual': {
       formality: 'casual',
       prefer: ['jeans', 't-shirt', 'sneakers', 'casual-shirt']
     },
     'gym': {
       formality: 'athletic',
       prefer: ['tracksuit', 'sports-shoes', 'tank-top', 'shorts']
     },
     'date': {
       formality: 'semi-formal',
       prefer: ['dress', 'nice-top', 'good-shoes', 'accessories']
     }
   };

   // Weather-based clothing suggestions
   this.weatherRules = {
     hot: { // >30°C
       avoid: ['jacket', 'sweater', 'long-sleeves', 'boots'],
       prefer: ['t-shirt', 'shorts', 'sandals', 'light-colors', 'cotton']
     },
     warm: { // 20-30°C
       prefer: ['light-shirt', 'jeans', 'sneakers', 'light-jacket']
     },
     cool: { // 10-20°C
       prefer: ['long-sleeves', 'light-jacket', 'jeans', 'closed-shoes']
     },
     cold: { // <10°C
       prefer: ['sweater', 'jacket', 'warm-pants', 'boots', 'dark-colors'],
       avoid: ['shorts', 'sandals', 't-shirt']
     },
     rainy: {
       prefer: ['waterproof-jacket', 'umbrella', 'waterproof-shoes'],
       avoid: ['light-colors', 'suede', 'canvas-shoes']
     }
   };
 }

 // Main recommendation function
 getOutfitRecommendation(params) {
   const {
     temperature,
     weather, // 'sunny', 'rainy', 'cloudy'
     calendarEvents, // array of events with type
     timeOfDay, // 'morning', 'afternoon', 'evening'
     userPreferences, // user's style preferences
     availableClothes, // user's wardrobe
     bodyType, // optional
     mood, // 'confident', 'comfortable', 'trendy'
     previousOutfits // to avoid repetition
   } = params;

   try {
     // Determine weather category
     const weatherCategory = this.getWeatherCategory(temperature, weather);
     
     // Get primary occasion from calendar
     const primaryOccasion = this.getPrimaryOccasion(calendarEvents, timeOfDay);
     
     // Generate base recommendations
     const recommendations = this.generateRecommendations({
       weatherCategory,
       primaryOccasion,
       userPreferences,
       availableClothes,
       mood,
       previousOutfits,
       timeOfDay
     });

     return {
       success: true,
       recommendations,
       reasoning: this.generateReasoning(weatherCategory, primaryOccasion, temperature),
       confidence: this.calculateConfidence(params)
     };

   } catch (error) {
     return {
       success: false,
       error: error.message,
       fallbackRecommendation: this.getFallbackRecommendation(temperature)
     };
   }
 }

 getWeatherCategory(temperature, weather) {
   let category;
   
   if (temperature > 30) category = 'hot';
   else if (temperature > 20) category = 'warm';
   else if (temperature > 10) category = 'cool';
   else category = 'cold';

   if (weather === 'rainy') category = 'rainy';
   
   return category;
 }

 getPrimaryOccasion(calendarEvents, timeOfDay) {
   if (!calendarEvents || calendarEvents.length === 0) {
     return timeOfDay === 'morning' ? 'work' : 'casual';
   }

   // Priority order for occasions
   const priorityOrder = ['meeting', 'work', 'party', 'date', 'gym', 'casual'];
   
   for (let priority of priorityOrder) {
     if (calendarEvents.some(event => event.type === priority)) {
       return priority;
     }
   }

   return 'casual';
 }

 generateRecommendations({ weatherCategory, primaryOccasion, userPreferences, availableClothes, mood, previousOutfits, timeOfDay }) {
   const weatherRules = this.weatherRules[weatherCategory] || {};
   const occasionRules = this.occasionRules[primaryOccasion] || {};
   
   // Filter available clothes based on rules
   const suitableClothes = this.filterClothes(availableClothes, weatherRules, occasionRules, previousOutfits);
   
   // Generate outfit combinations
   const outfits = this.generateOutfitCombinations(suitableClothes, userPreferences, mood);
   
   // Score and rank outfits
   const rankedOutfits = this.rankOutfits(outfits, {
     weatherCategory,
     primaryOccasion,
     userPreferences,
     timeOfDay
   });

   return rankedOutfits.slice(0, 3); // Return top 3 recommendations
 }

 filterClothes(availableClothes, weatherRules, occasionRules, previousOutfits) {
   if (!availableClothes) return [];

   return availableClothes.filter(item => {
     // Check weather restrictions
     if (weatherRules.avoid && weatherRules.avoid.includes(item.type)) return false;
     
     // Check occasion restrictions
     if (occasionRules.avoid && occasionRules.avoid.includes(item.type)) return false;
     
     // Avoid recently worn items
     if (previousOutfits && previousOutfits.some(outfit => 
       outfit.items.some(prevItem => prevItem.id === item.id)
     )) return false;

     return true;
   });
 }

 generateOutfitCombinations(clothes, userPreferences, mood) {
   const outfits = [];
   
   // Separate clothes by category
   const tops = clothes.filter(item => ['shirt', 't-shirt', 'blouse', 'top'].includes(item.type));
   const bottoms = clothes.filter(item => ['jeans', 'trousers', 'shorts', 'skirt'].includes(item.type));
   const shoes = clothes.filter(item => ['sneakers', 'dress-shoes', 'boots', 'sandals'].includes(item.type));
   const accessories = clothes.filter(item => ['watch', 'necklace', 'belt', 'bag'].includes(item.type));

   // Generate combinations
   for (let top of tops) {
     for (let bottom of bottoms) {
       for (let shoe of shoes) {
         // Check color compatibility
         if (this.areColorsCompatible(top.color, bottom.color)) {
           const outfit = {
             items: [top, bottom, shoe],
             style: this.determineOutfitStyle([top, bottom, shoe]),
             colors: [top.color, bottom.color, shoe.color]
           };

           // Add accessories if available
           if (accessories.length > 0) {
             const suitableAccessories = accessories.filter(acc => 
               this.areColorsCompatible(acc.color, top.color) || 
               this.areColorsCompatible(acc.color, bottom.color)
             );
             if (suitableAccessories.length > 0) {
               outfit.items.push(suitableAccessories[0]);
             }
           }

           outfits.push(outfit);
         }
       }
     }
   }

   return outfits;
 }

 areColorsCompatible(color1, color2) {
   if (!color1 || !color2) return true;
   
   const combinations = this.colorCombinations[color1.toLowerCase()];
   return combinations ? combinations.includes(color2.toLowerCase()) : true;
 }

 determineOutfitStyle(items) {
   const styles = items.map(item => item.style || 'casual');
   
   if (styles.includes('formal')) return 'formal';
   if (styles.includes('semi-formal')) return 'semi-formal';
   if (styles.includes('athletic')) return 'athletic';
   return 'casual';
 }

 rankOutfits(outfits, context) {
   return outfits.map(outfit => ({
     ...outfit,
     score: this.calculateOutfitScore(outfit, context)
   })).sort((a, b) => b.score - a.score);
 }

 calculateOutfitScore(outfit, context) {
   let score = 50; // Base score

   // Weather appropriateness
   const weatherRules = this.weatherRules[context.weatherCategory];
   if (weatherRules) {
     outfit.items.forEach(item => {
       if (weatherRules.prefer && weatherRules.prefer.includes(item.type)) score += 10;
       if (weatherRules.avoid && weatherRules.avoid.includes(item.type)) score -= 20;
     });
   }

   // Occasion appropriateness
   const occasionRules = this.occasionRules[context.primaryOccasion];
   if (occasionRules) {
     outfit.items.forEach(item => {
       if (occasionRules.prefer && occasionRules.prefer.includes(item.type)) score += 15;
       if (occasionRules.avoid && occasionRules.avoid.includes(item.type)) score -= 25;
     });
   }

   // Color harmony
   const uniqueColors = [...new Set(outfit.colors)];
   if (uniqueColors.length <= 3) score += 10; // Good color balance
   if (uniqueColors.length > 4) score -= 5; // Too many colors

   // User preferences
   if (context.userPreferences) {
     outfit.items.forEach(item => {
       if (context.userPreferences.favoriteColors && 
           context.userPreferences.favoriteColors.includes(item.color)) score += 5;
       if (context.userPreferences.preferredStyles && 
           context.userPreferences.preferredStyles.includes(item.style)) score += 5;
     });
   }

   return Math.max(0, Math.min(100, score)); // Clamp between 0-100
 }

 generateReasoning(weatherCategory, occasion, temperature) {
   const reasons = [];
   
   reasons.push(`Based on ${temperature}°C temperature, suggesting ${weatherCategory} weather appropriate clothing.`);
   reasons.push(`Primary occasion detected: ${occasion}, recommending ${occasion}-appropriate attire.`);
   
   if (weatherCategory === 'rainy') {
     reasons.push("Added waterproof options due to rain forecast.");
   }
   
   return reasons;
 }

 calculateConfidence(params) {
   let confidence = 70; // Base confidence
   
   if (params.calendarEvents && params.calendarEvents.length > 0) confidence += 10;
   if (params.userPreferences) confidence += 10;
   if (params.availableClothes && params.availableClothes.length > 10) confidence += 10;
   
   return Math.min(100, confidence);
 }

 getFallbackRecommendation(temperature) {
   if (temperature > 25) {
     return {
       items: [
         { type: 't-shirt', color: 'white' },
         { type: 'jeans', color: 'blue' },
         { type: 'sneakers', color: 'white' }
       ],
       reasoning: "Simple comfortable outfit for warm weather"
     };
   } else {
     return {
       items: [
         { type: 'shirt', color: 'blue' },
         { type: 'jeans', color: 'dark-blue' },
         { type: 'sneakers', color: 'black' }
       ],
       reasoning: "Versatile outfit suitable for moderate temperatures"
     };
   }
 }
}

// Usage example function
function getRecommendation() {
 const engine = new OutfitRecommendationEngine();
 
 const params = {
   temperature: 25,
   weather: 'sunny',
   calendarEvents: [
     { type: 'work', time: '09:00', title: 'Team Meeting' },
     { type: 'casual', time: '18:00', title: 'Dinner with friends' }
   ],
   timeOfDay: 'morning',
   userPreferences: {
     favoriteColors: ['blue', 'white', 'black'],
     preferredStyles: ['casual', 'semi-formal'],
     bodyType: 'medium'
   },
   availableClothes: [
     { id: 1, type: 'shirt', color: 'blue', style: 'formal' },
     { id: 2, type: 'jeans', color: 'dark-blue', style: 'casual' },
     { id: 3, type: 'sneakers', color: 'white', style: 'casual' },
     { id: 4, type: 't-shirt', color: 'white', style: 'casual' },
     { id: 5, type: 'trousers', color: 'black', style: 'formal' }
   ],
   mood: 'confident',
   previousOutfits: []
 };
 
 return engine.getOutfitRecommendation(params);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
 module.exports = { OutfitRecommendationEngine, getRecommendation };
}

// Example usage:
// const result = getRecommendation();
// console.log(result);