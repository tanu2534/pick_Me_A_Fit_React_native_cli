// RecommendationEngine.js
class OutfitRecommendationEngine {
    constructor() {
        this.colorCombinations = {
            'black': ['white', 'gray', 'red', 'pink', 'blue', 'yellow'],
            'white': ['black', 'blue', 'red', 'green', 'pink', 'brown'],
            'blue': ['white', 'black', 'gray', 'beige', 'brown'],
            'red': ['black', 'white', 'gray', 'blue'],
            'green': ['white', 'black', 'beige', 'brown'],
            'pink': ['black', 'white', 'gray', 'blue'],
            'gray': ['white', 'black', 'pink', 'blue', 'red'],
            'brown': ['white', 'beige', 'green', 'cream']
        };

        // Complete weather mapping for ALL categories
        this.weatherMapping = {
            hot: [
                // Tops
                'tops', 'shirt', 'top', 'blouse', 'tank', 't-shirt',
                // Bottoms
                'bottoms', 'shorts', 'skirt', 
                // Dresses
                'dresses', 'dress', 'gown',
                // Shoes
                'shoes', 'shoe', 'sandal',
                // Activewear
                'activewear', 'gym', 'sport', 'athletic', 'yoga'
            ],
            warm: [
                // Tops
                'tops', 'shirt', 'top', 'blouse', 'tank', 't-shirt',
                // Bottoms
                'bottoms', 'pants', 'jean', 'trouser', 'skirt', 'legging',
                // Dresses
                'dresses', 'dress', 'gown',
                // Shoes
                'shoes', 'shoe', 'sneaker', 'boot',
                // Activewear
                'activewear', 'gym', 'sport', 'athletic', 'yoga'
            ],
            cool: [
                // Tops
                'tops', 'shirt', 'top', 'blouse', 'sweater', 'hoodie', 't-shirt', 'longsleee',
                // Bottoms
                'bottoms', 'pants', 'jean', 'trouser', 'legging',
                // Outerwear
                'outwear', 'jacket', 'coat', 'blazer', 'cardigan',
                // Shoes
                'shoes', 'shoe', 'boot', 'sneaker',
                // Activewear
                'activewear', 'gym', 'sport', 'athletic'
            ],
            cold: [
                // Tops
                'tops', 'sweater', 'hoodie', 'longsleee', 'shirt', 'blouse',
                // Bottoms
                'bottoms', 'pants', 'jean', 'trouser', 'legging',
                // Outerwear
                'outwear', 'jacket', 'coat', 'blazer', 'cardigan',
                // Shoes
                'shoes', 'boot', 'sneaker',
                // Sleepwear (for cozy indoor wear)
                'sleepwear', 'robe'
            ]
        };

        // Occasion-based mapping
        this.occasionMapping = {
            casual: ['tops', 'bottoms', 'dresses', 'shoes', 'activewear'],
            formal: ['formal', 'suit', 'tuxedo', 'dress', 'gown', 'blazer', 'shoes'],
            work: ['tops', 'bottoms', 'blazer', 'formal', 'shoes'],
            party: ['dresses', 'formal', 'tops', 'bottoms', 'shoes', 'accessories'],
            gym: ['activewear', 'gym', 'sport', 'athletic', 'yoga'],
            sleep: ['sleepwear', 'pajama', 'nightgown', 'robe']
        };
    }

    getWeatherCategory(temp) {
        if (temp > 30) return 'hot';
        if (temp > 20) return 'warm';
        if (temp > 10) return 'cool';
        return 'cold';
    }

   generateOutfitCombinations(wardrobeItems) {
        const categories = {};
        wardrobeItems.forEach(item => {
            if (!categories[item.category]) categories[item.category] = [];
            categories[item.category].push(item);
        });

        const combinations = [];

        // All possible top categories
        const tops = [
            ...(categories.tops || []),
            ...(categories.shirt || []),
            ...(categories.top || []),
            ...(categories.blouse || []),
            ...(categories.sweater || []),
            ...(categories.hoodie || []),
            ...(categories.tank || []),
            ...(categories['t-shirt'] || []),
            ...(categories.longsleee || [])
        ];

        // All possible bottom categories
        const bottoms = [
            ...(categories.bottoms || []),
            ...(categories.pants || []),
            ...(categories.jean || []),
            ...(categories.trouser || []),
            ...(categories.shorts || []),
            ...(categories.skirt || []),
            ...(categories.legging || [])
        ];

        // Top + Bottom combinations
        tops.forEach(top => {
            bottoms.forEach(bottom => {
                combinations.push({
                    items: [top, bottom],
                    type: 'top_bottom'
                });
            });
        });

        // Dresses (standalone)
        const dresses = [
            ...(categories.dresses || []),
            ...(categories.dress || []),
            ...(categories.gown || [])
        ];

        dresses.forEach(dress => {
            combinations.push({
                items: [dress],
                type: 'dress'
            });
        });

        // Formal suits
        const formalTops = [
            ...(categories.formal || []),
            ...(categories.suit || []),
            ...(categories.tuxedo || [])
        ];

        formalTops.forEach(formal => {
            combinations.push({
                items: [formal],
                type: 'formal'
            });
        });

        // Activewear combinations
        const activewear = [
            ...(categories.activewear || []),
            ...(categories.gym || []),
            ...(categories.sport || []),
            ...(categories.athletic || []),
            ...(categories.yoga || [])
        ];

        activewear.forEach(active => {
            combinations.push({
                items: [active],
                type: 'activewear'
            });
        });

        // Sleepwear
        const sleepwear = [
            ...(categories.sleepwear || []),
            ...(categories.pajama || []),
            ...(categories.nightgown || []),
            ...(categories.robe || [])
        ];

        sleepwear.forEach(sleep => {
            combinations.push({
                items: [sleep],
                type: 'sleepwear'
            });
        });

        return combinations;
    }

   scoreOutfit(outfit, weather, occasion = 'casual', recentItems = []) {
        let score = 100;
        const items = outfit.items;
        const weatherCategory = this.getWeatherCategory(weather);
        const suitableCategories = this.weatherMapping[weatherCategory] || [];
        const occasionCategories = this.occasionMapping[occasion] || [];

        items.forEach(item => {
            // Weather appropriateness
            if (suitableCategories.includes(item.category)) {
                score += 20;
            } else {
                score -= 30;
            }

            // Occasion appropriateness
            if (occasionCategories.includes(item.category)) {
                score += 15;
            }

            // Avoid recently worn items
            if (recentItems.includes(item.id)) {
                score -= 50;
            }
        });

        return Math.max(0, score);
    }


     recommendOutfits(wardrobeItems, weather = 25, occasion = 'casual', recentItems = [], count = 3) {
        const combinations = this.generateOutfitCombinations(wardrobeItems);

        const scoredOutfits = combinations.map(combo => ({
            outfit: combo,
            score: this.scoreOutfit(combo, weather, occasion, recentItems)
        }));

        // Sort by score and return top recommendations
        scoredOutfits.sort((a, b) => b.score - a.score);

        return scoredOutfits.slice(0, count).map((item, index) => ({
            id: `rec_${index + 1}`,
            items: item.outfit.items,
            score: item.score,
            type: item.outfit.type
        }));
    }

}

export default OutfitRecommendationEngine;