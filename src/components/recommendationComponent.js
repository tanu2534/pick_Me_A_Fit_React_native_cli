import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import OutfitRecommendationEngine from '../services/recommendation'; // adjust path

const RecommendationComponent = ({
     selectedDate = null,
    temperature,
    hasPlannedOutfit = false, // New prop
    onOutfitSelected = null
}) => {
    const [recommendation, setRecommendations] = useState(null);
    const [recommendationMessage, setRecommendationMessage] = useState(null);
    const [selectedOutfit, setSelectedOutfit] = useState(null);
    const [plannedOutfit, setPlannedOutfit] = useState(null); // for future dates

    const MIN_TOPS = 2;
    const MIN_BOTTOMS = 2;
    const MIN_TOTAL = 5;

    const getDateKey = (date) => {
        if (!date) return new Date().toISOString().split('T')[0];
        return new Date(date).toISOString().split('T')[0];
    };

    const isToday = (date) => {
        const today = new Date().toISOString().split('T')[0];
        const compareDate = getDateKey(date);
        return today === compareDate;
    };

    const isFutureDate = (date) => {
        const today = new Date().toISOString().split('T')[0];
        const compareDate = getDateKey(date);
        return compareDate > today;
    };

    // Your existing functions (copy from HomeScreen)
    const hasEnoughItems = (wardrobe = []) => {
        const tops = wardrobe.filter(item =>
            ['tops', 'shirt', 'top', 'blouse', 't-shirt', 'tank'].includes(item.category));
        const bottoms = wardrobe.filter(item =>
            ['bottoms', 'pants', 'jean', 'shorts', 'trouser', 'skirt'].includes(item.category));
        return tops.length >= MIN_TOPS && bottoms.length >= MIN_BOTTOMS && wardrobe.length >= MIN_TOTAL;
    };

    const getLastWashDate = (washcycle) => {
        // Copy your existing function
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (washcycle.type) {
            case 'Daily':
                return today;
            // ... rest of your wash cycle logic
            default:
                return new Date(0);
        }
    };

    const getUnwashedItems = (wardrobeItems, washcycle) => {
        // Copy your existing function
        const lastWashDate = getLastWashDate(washcycle);
        return wardrobeItems.filter(item => {
            if (!item.wearAt) return false;
            const wornDate = new Date(item.wearAt);
            return wornDate > lastWashDate;
        });
    };

    // Modified handleWearToday for different dates
    const handleWearToday = async (outfitItems, outfitIndex) => {
        try {
            const dateKey = getDateKey(selectedDate);
            const currentDate = new Date().toISOString();

            // Get current wardrobe items
            let wardrobeItems = await AsyncStorage.getItem("@smartWardrobeItems");
            wardrobeItems = JSON.parse(wardrobeItems) || [];

            // If it's today, update wearAt field
            if (isToday(selectedDate)) {
                const updatedWardrobe = wardrobeItems.map(item => {
                    const outfitItem = outfitItems.find(oItem => oItem.id === item.id);
                    if (outfitItem) {
                        return { ...item, wearAt: currentDate };
                    }
                    return item;
                });

                await AsyncStorage.setItem("@smartWardrobeItems", JSON.stringify(updatedWardrobe));

                // Save for today
                const selectedOutfitData = {
                    items: outfitItems,
                    selectedAt: currentDate,
                    outfitNumber: outfitIndex + 1,
                    date: dateKey
                };
                await AsyncStorage.setItem("@todaySelectedOutfit", JSON.stringify(selectedOutfitData));
                setSelectedOutfit(selectedOutfitData);
            } else {
                // Save for future date in planner
                const plannedOutfitData = {
                    items: outfitItems,
                    plannedAt: currentDate,
                    outfitNumber: outfitIndex + 1,
                    date: dateKey
                };

                // Get existing planned outfits
                let plannedOutfits = await AsyncStorage.getItem("@plannedOutfits");
                plannedOutfits = JSON.parse(plannedOutfits) || {};
                plannedOutfits[dateKey] = plannedOutfitData;

                await AsyncStorage.setItem("@plannedOutfits", JSON.stringify(plannedOutfits));
                setPlannedOutfit(plannedOutfitData);
            }

            // Clear recommendations
            setRecommendations(null);

            // Call callback if provided
            if (onOutfitSelected) {
                onOutfitSelected(outfitItems, outfitIndex, dateKey);
            }

        } catch (error) {
            console.error("Error updating outfit selection:", error);
        }
    };

    const loadRecommendations = async () => {
        console.log("Loading recommendations for", selectedDate);
        try {
            const dateKey = getDateKey(selectedDate);
            console.log("Date key:", dateKey);

            // Check if outfit already selected for this date
            if (isToday(selectedDate)) {
                const selectedOutfitData = await AsyncStorage.getItem("@todaySelectedOutfit");
                console.log("Selected outfit data:", selectedOutfitData);
                if (selectedOutfitData) {
                    const outfit = JSON.parse(selectedOutfitData);
                    console.log("Parsed outfit:", outfit);
                    if (outfit.date === dateKey) {
                        console.log("Outfit already selected for today");
                        setSelectedOutfit(outfit);
                              setPlannedOutfit(null); // Clear planned outfit
                        setRecommendations(null);
                        return;
                    }
                }
            } else {
                // Check planned outfits for future dates
                const plannedOutfits = await AsyncStorage.getItem("@plannedOutfits");
                console.log("Planned outfits:", plannedOutfits);
                if (plannedOutfits) {
                    const planned = JSON.parse(plannedOutfits);
                    console.log("Parsed planned outfits:", planned);
                    if (planned[dateKey]) {
                        console.log("Planned outfit found for", dateKey);
                        setPlannedOutfit(planned[dateKey]);
                          setSelectedOutfit(null); // Clear selected outfit
                        setRecommendations(null);
                        return;
                    }
                }
            }

             if (hasPlannedOutfit) {
                console.log("Parent says outfit is planned but we didn't find it, refreshing...");
                // Force refresh by not returning here, let recommendations load
                // This handles edge cases where parent and child are out of sync
            }
                setSelectedOutfit(null);
            setPlannedOutfit(null);

            // Load wash cycle info
            let washcycle = await AsyncStorage.getItem("washcycle");
            console.log("Wash cycle:", washcycle);
            washcycle = JSON.parse(washcycle);
            if (!washcycle) {
                console.log("Wash cycle not set by user");
                setRecommendationMessage("Wash cycle not set by user");
                 setRecommendations(null);
                return;
            }

            // Load wardrobe
            let Wardrobe = await AsyncStorage.getItem("@smartWardrobeItems");
            console.log("Wardrobe:", Wardrobe);
            Wardrobe = JSON.parse(Wardrobe);
            if (!Wardrobe || !Array.isArray(Wardrobe) || Wardrobe.length === 0) {
                console.log("No wardrobe items found");
                setRecommendationMessage("No wardrobe items found. Please add wardrobe to get daily recommendations.");
                  setRecommendations(null);
                return;
            }

            if (!hasEnoughItems(Wardrobe)) {
                console.log("Not enough wardrobe items to generate recommendations");
                setRecommendationMessage("Not enough wardrobe items to generate recommendations, at least 2 tops and 2 bottoms and total of 5 items are required.");
                  setRecommendations(null);
                return;
            }

            const unwashedItems = getUnwashedItems(Wardrobe, washcycle);
            console.log("Unwashed items:", unwashedItems);
            const recentWornIds = unwashedItems.map(item => item.id);
            console.log("Recent worn item IDs:", recentWornIds);

            const engine = new OutfitRecommendationEngine();
            console.log("Engine created");
            const recommendations = engine.recommendOutfits(Wardrobe, parseInt(temperature || 25), "casual", recentWornIds);
            console.log("Recommendations:", recommendations);

            setRecommendations(recommendations);

        } catch (error) {
            console.error("Error loading recommendations:", error);
            setRecommendationMessage("Error loading recommendations");
        }
    };

    useEffect(() => {
        loadRecommendations();
    }, [selectedDate, temperature, hasPlannedOutfit]);

    const currentOutfit = selectedOutfit || plannedOutfit;
    const dateKey = getDateKey(selectedDate);
    const displayDate = selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Today';

    return (
        <ScrollView style={{ flex: 1 }}>
            {currentOutfit ? (
                // Show selected/planned outfit
                <View style={{ paddingHorizontal: 10, paddingTop: 10 }}>
                    <View style={{
                        backgroundColor: '#fdf1f6',
                        borderRadius: 12,
                        padding: 15,
                        marginBottom: 15,
                        borderLeftWidth: 4,
                        borderLeftColor: '#d36491'
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                            <Text style={{
                                fontSize: 18,
                                fontFamily: 'Raleway-Bold',
                                color: '#666666ff',
                                marginRight: 10
                            }}>
                                {currentOutfit?.isManual ? 'Custom ' : ''}
                                {isFutureDate(selectedDate) ? `Planned Outfit for ${displayDate}` : `${displayDate}'s Selected Outfit`}
                            </Text>
                        </View>

                        <Text style={{
                            fontSize: 16,
                            fontFamily: 'Raleway-SemiBold',
                            color: '#000000ff',
                            marginBottom: 5,
                            opacity:0.6
                        }}>
                            Outfit {currentOutfit.outfitNumber}
                        </Text>

                        <Text style={{
                            fontSize: 14,
                            fontFamily: 'Raleway-Medium',
                            color: '#000000ff',
                            marginBottom: 15,
                            opacity: 0.5
                        }}>
                            {isFutureDate(selectedDate)
                                ? `Planned on ${new Date(currentOutfit.plannedAt).toLocaleDateString()}`
                                : `Selected on ${new Date(currentOutfit.selectedAt).toLocaleDateString()}`
                            }
                        </Text>

                        {/* Items Grid - same as your existing code */}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-around',
                            marginBottom: 10
                        }}>
                            {currentOutfit.items.map((item, idx) => (
                                <View key={idx} style={{ alignItems: 'center', width: '45%' }}>
                                    <View style={{
                                        width: '100%',
                                        height: 120,
                                        backgroundColor: '#fdf1f6',
                                        borderRadius: 20,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: 8,
                                        borderWidth: 1,
                                        borderColor: '#ecd8e4ff'
                                    }}>
                                        <Image
                                            source={{ uri: item.uri }}
                                            style={{
                                                width: '90%',
                                                height: '90%',
                                                borderRadius: 6,
                                                resizeMode: 'cover'
                                            }}
                                        />
                                    </View>
                                    <Text style={{
                                        fontFamily: 'Raleway-Medium',
                                        fontSize: 14,
                                        color: '#d36491',
                                        textTransform: 'capitalize',
                                        textAlign: 'center'
                                    }}>
                                        {item.label}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            ) : (
                // Show recommendations
                recommendation ? (
                    <View style={{ paddingHorizontal: 10, paddingTop: 10 }}>
                        <Text style={{
                            color: 'black',
                            fontSize: 20,
                            fontFamily: 'Raleway-SemiBold',
                            opacity: 0.7,
                            marginBottom: 5
                        }}>
                            Recommendation for {displayDate}
                        </Text>

                        <Text style={{
                            color: 'black',
                            fontSize: 13,
                            fontFamily: 'Raleway-Regular',
                            opacity: 0.6,
                            marginBottom: 15,
                            lineHeight: 18
                        }}>
                            {isFutureDate(selectedDate)
                                ? `Plan your outfit for ${displayDate}. Click "Plan for ${displayDate}" to save it.`
                                : 'If you\'re wearing any recommended outfit, click "Wear Today" so we can track your wash cycle.'
                            }
                        </Text>

                        {recommendation.map((rec, index) => (
                            <View key={rec.id || index} style={{
                                marginBottom: 15,
                                padding: 15,
                                borderRadius: 12,
                                backgroundColor: '#fff',
                                elevation: 2,
                                shadowColor: '#000',
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                shadowOffset: { width: 0, height: 2 }
                            }}>
                                {/* Your existing recommendation UI */}
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 15
                                }}>
                                    <Text style={{
                                        fontSize: 18,
                                        fontFamily: 'Raleway-Bold',
                                        color: '#333'
                                    }}>
                                        Outfit {index + 1}
                                    </Text>
                                    <TouchableOpacity>
                                        <Text style={{ fontSize: 16, color: '#ccc' }}>♡</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Items Grid - same as your existing code */}
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-around',
                                    marginBottom: 15
                                }}>
                                    {rec.items.map((item, idx) => (
                                        <View key={idx} style={{ alignItems: 'center', width: '45%' }}>
                                            <View style={{
                                                width: '100%',
                                                height: 120,
                                                backgroundColor: '#fdf1f6',
                                                borderRadius: 20,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginBottom: 8,
                                                borderWidth: 1,
                                                borderColor: '#f1efefff'
                                            }}>
                                                <Image
                                                    source={{ uri: item.uri }}
                                                    style={{
                                                        width: '90%',
                                                        height: '90%',
                                                        borderRadius: 6,
                                                        resizeMode: 'cover'
                                                    }}
                                                />
                                            </View>
                                            <Text style={{
                                                fontFamily: 'Raleway-Medium',
                                                fontSize: 14,
                                                color: '#666',
                                                textTransform: 'capitalize',
                                                textAlign: 'center'
                                            }}>
                                                {item.label}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Dynamic Button */}
                                <TouchableOpacity
                                    onPress={() => handleWearToday(rec.items, index)}
                                    style={{
                                        backgroundColor: '#d36491',
                                        paddingVertical: 12,
                                        paddingHorizontal: 16,
                                        borderRadius: 8,
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Image
                                        source={require('../../assets/images/star.png')}
                                        style={{ height: 20, width: 20, marginRight: 5 }}
                                    />
                                    <Text style={{
                                        color: '#fff',
                                        fontSize: 14,
                                        fontFamily: 'Raleway-Bold'
                                    }}>
                                        {isFutureDate(selectedDate) ? `Plan for ${displayDate}` : 'Wear Today'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                ) : (
                    // No recommendations
                    <View style={{
                        marginTop: 5,
                        width: '95%',
                        alignSelf: 'center',
                        paddingHorizontal: 10
                    }}>
                        <Text style={{
                            color: 'black',
                            fontSize: 20,
                            marginTop: 10,
                            fontFamily: 'Raleway-SemiBold',
                            opacity: 0.7
                        }}>
                            No Recommendation for {displayDate}
                        </Text>

                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                            <Image
                                source={require('../../assets/images/no.png')}
                                style={{
                                    height: 40,
                                    width: 40,
                                    opacity: 0.6,
                                    marginBottom: 10
                                }}
                            />
                            <Text style={{
                                color: 'black',
                                width: '80%',
                                fontSize: 14,
                                fontFamily: 'Raleway-Regular',
                                opacity: 0.5,
                                textAlign: 'center',
                                lineHeight: 20
                            }}>
                                {recommendationMessage}
                            </Text>
                        </View>
                    </View>
                )
            )}
        </ScrollView>
    );
};

export default RecommendationComponent;