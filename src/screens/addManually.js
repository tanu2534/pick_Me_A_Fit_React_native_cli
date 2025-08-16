import AsyncStorage from "@react-native-async-storage/async-storage"
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from "@react-navigation/native"
// import { Animated } from "react-native"
import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native"
import { clothingCategories } from '../services/data/catogories'
import { predictWithYusyelModel } from '../services/huggingface/huggingFaceClient'
import { getBase64FromUri } from '../services/utils/imageUtils'
import { removeBackgroundFromImageUri } from '../utility/removeBackground'

const { width } = Dimensions.get("window")

export default function ManualAdd() {
  const [status, setStatus] = useState("idle") // idle, selecting, processing, complete
  const [selectedImage, setSelectedImage] = useState(null)
  const [itemName, setItemName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [addedItems, setAddedItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const pulseAnimation = useRef(new Animated.Value(0)).current
  const scaleAnimation = useRef(new Animated.Value(1)).current

  const navigation = useNavigation();

  // Load categories on component mount
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoadingCategories(true)
      // Load from your services/data/categories
      setCategories(clothingCategories)
    } catch (error) {
      console.error("Error loading categories:", error)
      setCategories([]) // Fallback to empty array
    } finally {
      setLoadingCategories(false)
    }
  }

  const mapPredictionToCategory = (label) => {
    if (!label) return "accessories"
    const lowercaseLabel = label.toLowerCase()
    
    // Enhanced mapping with more categories
    const mappings = {
      "tops": ["shirt", "top", "blouse", "sweater", "hoodie", "tank", 't-shirt', "longsleee"],
      "bottoms": ["pants", "jean", "trouser", "shorts", "skirt", "legging"],
      "dresses": ["dress", "gown"],
      "outwear": ["jacket", "coat", "blazer", "cardigan"],
      "shoes": ["shoe", "boot", "sneaker", "sandal", "heel"],
      "accessories": ["bag", "belt", "watch", "hat", "scarf"],
      "activewear": ["gym", "sport", "athletic", "yoga"],
      "formal": ["suit", "tuxedo", "formal"],
      "sleepwear": ["pajama", "nightgown", "robe"],
      "undergarments": ["bra", "underwear", "sock"]
    }
    
    for (const [category, keywords] of Object.entries(mappings)) {
      if (keywords.some(keyword => lowercaseLabel.includes(keyword))) {
        return category
      }
    }
    
    return "accessories"
  }

  // Request camera/gallery permission and open image picker
const selectImage = async () => {
  try {
    const options = {
      mediaType: 'photo',
      includeBase64: false, // true agar base64 chahiye
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets.length > 0) {
        const selectedAsset = response.assets[0];
        setSelectedImage(selectedAsset); // apna state update karo
        setStatus("selecting");

        // Auto-analyze the image
        await analyzeImage(selectedAsset.uri);
      }
    });
  } catch (error) {
    console.error('Error selecting image:', error);
    Alert.alert('Error', 'Failed to select image');
  }
};

  // Analyze image with AI
const analyzeImage = async (imageUri) => {
  try {
    setIsAnalyzing(true);
    startPulseAnimation();

    // Remove background (you'll define this below)
    const bgRemovedUri = await removeBackgroundFromImageUri(imageUri);

    if (!bgRemovedUri) throw new Error("BG removal failed");

    setSelectedImage({ uri: bgRemovedUri });

    const base64 = await getBase64FromUri(bgRemovedUri);
    if (!base64) throw new Error("Failed to convert image");

    const prediction = await predictWithYusyelModel(base64);
    const predictedCategory = mapPredictionToCategory(prediction?.[0]?.label);

    setSelectedCategory(predictedCategory);

    if (prediction?.[0]?.label) {
      const cleanLabel = prediction[0].label.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      setItemName(cleanLabel);
    }

    setIsAnalyzing(false);
    stopPulseAnimation();
  } catch (error) {
    console.error("Analysis error:", error);
    setIsAnalyzing(false);
    stopPulseAnimation();
    setSelectedCategory("accessories");
  }
}
  // Save item to wardrobe
  const saveItem = async () => {
    if (!selectedImage || !itemName.trim() || !selectedCategory) {
      Alert.alert("Missing information", "Please fill in all fields")
      return
    }

    try {
      setStatus("processing")
      startScaleAnimation()

      const newItem = {
        id: Date.now().toString(),
        uri: selectedImage.uri,
        type: selectedCategory,
        label: itemName.trim(),
        category: selectedCategory,
        subcategory: selectedSubcategory || null,
        addedAt: new Date().toISOString(),
        isManuallyAdded: true
      }

      // Save to AsyncStorage
      const existing = JSON.parse(await AsyncStorage.getItem('@smartWardrobeItems')) || []
      const updated = [...existing, newItem]
      await AsyncStorage.setItem('@smartWardrobeItems', JSON.stringify(updated))

      setAddedItems(prev => [...prev, newItem])
      
      // Small delay for animation
      setTimeout(() => {
        setStatus("complete")
        resetScaleAnimation()
      }, 1000)

    } catch (error) {
      console.error("Error saving item:", error)
      Alert.alert("Error", "Failed to save item")
      setStatus("selecting")
    }
  }

  // Reset form for adding another item
  const addAnother = () => {
    setSelectedImage(null)
    setItemName("")
    setSelectedCategory("")
    setSelectedSubcategory("")
    setStatus("idle")
  }

  // Animation functions
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }

  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation()
    pulseAnimation.setValue(0)
  }

  const startScaleAnimation = () => {
    Animated.timing(scaleAnimation, {
      toValue: 1.1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }

  const resetScaleAnimation = () => {
    Animated.timing(scaleAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  // Animation interpolations
  const pulseScale = pulseAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  })

  const pulseOpacity = pulseAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 1, 0.7],
  })

  const goBack = () => {
    // router.back()
    navigation.goBack();
  }

  const continueToWardrobe = () => {
  //  router.replace('/(tabs)/explore');
  navigation.navigate('tabs', { screen: 'explore' });
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Image source={require('../../assets/images/back.png')} style={{ height: 30, width: 30, marginVertical: 10 , backgroundColor: 'transparent'}} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {status === "idle" ? "Add Manually" : 
           status === "selecting" ? "Add Item Details" : 
           status === "processing" ? "Saving Item..." : "Item Added!"}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Initial State - Select Image */}
          {status === "idle" && (
            <View style={styles.startContainer}>
              <Image source={require("../../assets/images/ai3.png")} style={styles.aiIcon} />
              <Text style={styles.startTitle}>Add Clothing Item</Text>
              <Text style={styles.startDescription}>
                Take a photo or select from your gallery. Our AI will help identify and categorize your item.
              </Text>
              <TouchableOpacity style={styles.startButton} onPress={selectImage}>
                <Text style={styles.startButtonText}>Select Photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Selection State - Fill Details */}
          {status === "selecting" && (
            <View style={styles.selectingContainer}>
              {/* Selected Image */}
              <View style={styles.imageContainer}>
                {isAnalyzing && (
                  <Animated.View
                    style={[
                      styles.analyzingOverlay,
                      {
                        transform: [{ scale: pulseScale }],
                        opacity: pulseOpacity,
                      },
                    ]}
                  >
                    <Text style={styles.analyzingText}>Analyzing...</Text>
                  </Animated.View>
                )}
                <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
              </View>

              {/* Item Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Item Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Blue Denim Jacket"
                  value={itemName}
                  onChangeText={setItemName}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Category Selection */}
              <View style={styles.categoryContainer}>
                <Text style={styles.inputLabel}>Category</Text>
                {loadingCategories ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#d36491" />
                    <Text style={styles.loadingText}>Loading categories...</Text>
                  </View>
                ) : (
                  <View style={styles.categoryGrid}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryButton,
                          { backgroundColor: category.color + "20" },
                          selectedCategory === category.id && {
                            backgroundColor: category.color,
                            borderColor: category.color,
                          }
                        ]}
                        onPress={() => {
                          setSelectedCategory(category.id)
                          setSelectedSubcategory("") // Reset subcategory
                          setItemName(category.name)
                        }}
                      >
                        <Text style={styles.categoryIcon}>{category.icon}</Text>
                        <Text style={[
                          styles.categoryName,
                          selectedCategory === category.id && styles.selectedCategoryName
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Subcategory Selection (if category is selected) */}
              {selectedCategory && categories.find(cat => cat.id === selectedCategory)?.subcategories && (
                <View style={styles.subcategoryContainer}>
                  <Text style={styles.inputLabel}>Subcategory (Optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.subcategoryRow}>
                      {categories
                        .find(cat => cat.id === selectedCategory)
                        ?.subcategories?.map((subcat, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.subcategoryButton,
                            selectedSubcategory === subcat && styles.selectedSubcategoryButton
                          ]}
                          onPress={() => setSelectedSubcategory(selectedSubcategory === subcat ? "" : subcat)}
                        >
                          <Text style={[
                            styles.subcategoryText,
                            selectedSubcategory === subcat && styles.selectedSubcategoryText
                          ]}>
                            {subcat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setStatus("idle")}>
                  <Text style={styles.secondaryButtonText}>Change Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={saveItem}>
                  <Text style={styles.primaryButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Processing State */}
          {status === "processing" && (
            <View style={styles.processingContainer}>
              <Animated.View style={[styles.processingIcon, { transform: [{ scale: scaleAnimation }] }]}>
                <Image source={require("../../assets/images/ai3.png")} style={styles.aiIcon} />
              </Animated.View>
              <Text style={styles.processingText}>Adding to your wardrobe...</Text>
            </View>
          )}

          {/* Complete State */}
          {status === "complete" && (
            <View style={styles.completeContainer}>
              <Image source={require("../../assets/images/ai3.png")} style={styles.completeIcon} />
              <Text style={styles.completeTitle}>Item Added Successfully!</Text>
              <Text style={styles.completeDescription}>
                "{itemName}" has been added to your {selectedCategory} collection{selectedSubcategory ? ` as ${selectedSubcategory}` : ""}.
              </Text>

              {/* Recently Added Items */}
              {addedItems.length > 0 && (
                <View style={styles.recentlyAddedContainer}>
                  {/* <Text style={styles.recentlyAddedTitle}>Recently Added</Text> */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {addedItems.length > 0 && (
  <View style={styles.recentlyAddedContainer}>
    <Text style={styles.recentlyAddedTitle}>Recently Added</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {addedItems.slice(-5).map((item, index) => {
        const animatedValue = new Animated.Value(0);
        
        // Start animation when component mounts
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 300,
          delay: index * 100,
          useNativeDriver: true,
        }).start();

        return (
          <Animated.View
            key={item.id}
            style={[
              styles.recentItemContainer,
              {
                opacity: animatedValue,
                transform: [{
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }]
              }
            ]}
          >
            <Image source={{ uri: item.uri }} style={styles.recentItemImage} />
            <Text style={styles.recentItemName} numberOfLines={1}>{item.label}</Text>
          </Animated.View>
        );
      })}
    </ScrollView>
  </View>
)}
                  </ScrollView>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.secondaryButton} onPress={addAnother}>
                  <Text style={styles.secondaryButtonText}>Add Another</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={continueToWardrobe}>
                  <Text style={styles.primaryButtonText}>View Wardrobe</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    marginTop: 10,
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
    fontFamily: "Raleway-Bold",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },

  // Start screen styles
  startContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  aiIcon: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  startTitle: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "Raleway-Bold",
  },
  startDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    color: "#666666",
    lineHeight: 22,
    fontFamily: "Raleway-Regular",
  },
  startButton: {
    backgroundColor: "#d36491",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Raleway-Bold",
  },

  // Selecting screen styles
  selectingContainer: {
    alignItems: "center",
    paddingBottom: 40,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 24,
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  analyzingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  analyzingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Raleway-Bold",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: "Raleway-Bold",
    marginBottom: 8,
    color: "#333",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Raleway-Regular",
    backgroundColor: "#FAFAFA",
  },
  categoryContainer: {
    width: "100%",
    marginBottom: 24,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
    fontFamily: "Raleway-Regular",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryButton: {
    width: "48%",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontFamily: "Raleway-Regular",
    color: "#666",
    textAlign: "center",
  },
  selectedCategoryName: {
    color: "#FFFFFF",
    fontFamily: "Raleway-Bold",
  },
  subcategoryContainer: {
    width: "100%",
    marginBottom: 24,
  },
  subcategoryRow: {
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  subcategoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  selectedSubcategoryButton: {
    backgroundColor: "#d36491",
    borderColor: "#d36491",
  },
  subcategoryText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Raleway-Regular",
  },
  selectedSubcategoryText: {
    color: "#FFFFFF",
    fontFamily: "Raleway-Bold",
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#d36491",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Raleway-Bold",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 16,
    fontFamily: "Raleway-Regular",
  },

  // Processing screen styles
  processingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  processingIcon: {
    marginBottom: 24,
  },
  processingText: {
    fontSize: 18,
    fontFamily: "Raleway-Regular",
    color: "#666",
  },

  // Complete screen styles
  completeContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  completeIcon: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 24,
    marginBottom: 16,
    fontFamily: "Raleway-Bold",
    textAlign: "center",
  },
  completeDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    color: "#666666",
    fontFamily: "Raleway-Regular",
  },
  recentlyAddedContainer: {
    width: "100%",
    marginBottom: 32,
  },
  recentlyAddedTitle: {
    fontSize: 18,
    fontFamily: "Raleway-Bold",
    marginBottom: 12,
  },
  recentItemContainer: {
    marginRight: 12,
    alignItems: "center",
  },
  recentItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: "#F5F5F5",
  },
  recentItemName: {
    fontSize: 12,
    fontFamily: "Raleway-Regular",
    textAlign: "center",
    width: 60,
  },
})