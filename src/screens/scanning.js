import AsyncStorage from "@react-native-async-storage/async-storage"
import { PermissionsAndroid, Platform } from "react-native";
import CameraRoll from "@react-native-camera-roll/camera-roll";
import { useNavigation } from "@react-navigation/native"
import { MotiView } from "moti"
import { useEffect, useRef, useState } from "react"
import { Animated, Dimensions, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { predictWithYusyelModelMulti } from '../services/huggingface/huggingFaceClient'
import { getBase64FromUri } from '../services/utils/imageUtils'
import { removeBackgroundFromImageUri } from '../utility/removeBackground'

const { width } = Dimensions.get("window")

export default function GalleryScan() {
 const BATCH_SIZE = 5; 
 const [status, setStatus] = useState("idle") // idle, scanning, complete
 const [permission, setPermission] = useState(null)
 const [progress, setProgress] = useState(0)
 const [scannedImages, setScannedImages] = useState([])
 const [categories, setCategories] = useState({
   tops: 0,
   bottoms: 0,
   dresses: 0,
   shoes: 0,
   accessories: 0,
 })
 const [scanOffset, setScanOffset] = useState(0) // Track how many photos we've scanned
 const [totalPhotosAvailable, setTotalPhotosAvailable] = useState(null)
 const [isFirstScan, setIsFirstScan] = useState(true)

 const scanAnimation = useRef(new Animated.Value(0)).current
 const pulseAnimation = useRef(new Animated.Value(0)).current
 const navigation = useNavigation();

 const mapPredictionToCategory = (label) => {
   if (!label) return "Unlabeled"
   return label.toLowerCase().replace("-", " ")
 }

 // Load scan progress from storage
 useEffect(() => {
   loadScanProgress()
 }, [])

 const loadScanProgress = async () => {
   try {
     const savedOffset = await AsyncStorage.getItem('@scanOffset')
     const savedTotalPhotos = await AsyncStorage.getItem('@totalPhotosAvailable')
     
     if (savedOffset) {
       setScanOffset(parseInt(savedOffset))
       setIsFirstScan(false)
     }
     if (savedTotalPhotos) {
       setTotalPhotosAvailable(parseInt(savedTotalPhotos))
     } else {
       // If no saved total photos, get the count
       const totalAssets = await MediaLibrary.getAssetsAsync({
         first: 0,
         mediaType: "photo",
         sortBy: [MediaLibrary.SortBy.creationTime],
       })
       setTotalPhotosAvailable(totalAssets.totalCount)
     }
   } catch (error) {
     console.error("Error loading scan progress:", error)
     setTotalPhotosAvailable(0)
   }
 }

 const saveScanProgress = async (offset, totalPhotos) => {
   try {
     await AsyncStorage.setItem('@scanOffset', offset.toString())
     await AsyncStorage.setItem('@totalPhotosAvailable', totalPhotos.toString())
   } catch (error) {
     console.error("Error saving scan progress:", error)
   }
 }

 // Request permission and start scanning
 const startScanning = async () => {
  let hasPermission = true;

if (Platform.OS === "android") {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES || PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    {
      title: "Permission needed",
      message: "We need access to your photos to scan your clothes",
      buttonPositive: "OK"
    }
  );
  hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
}

if (!hasPermission) {
  alert("We need access to your media library to scan your clothes");
  return;
}


   setStatus("scanning")
   simulateScanMulti()
 }

 const simulateScanMulti = async () => {
   try {
     // First, get total count of photos
     const totalAssets = await CameraRoll.getPhotos({
  first: 1, // sirf count ke liye
  assetType: "Photos",
});
const totalPhotosCount = totalAssets.edges.length; // count manually maintain karna hoga

     
 
     setTotalPhotosAvailable(totalPhotosCount)

     // Check if we have more photos to scan
     if (scanOffset >= totalPhotosCount) {
       alert("All photos have been scanned!")
       setStatus("idle")
       return
     }

     // Get the next batch of photos
    const photos = await CameraRoll.getPhotos({
  first: BATCH_SIZE,
  assetType: "Photos",
  // after: lastCursor // pagination ke liye cursor use hoga
});
const assets = photos.edges.map(edge => ({
  id: edge.node.image.uri, // ya koi unique id generate karo
  uri: edge.node.image.uri
}));


     const remainingPhotos = totalPhotosCount - scanOffset
     const photosToScan = Math.min(assets.length, BATCH_SIZE, remainingPhotos)
     
     if (photosToScan === 0) {
       alert("No more photos to scan!")
       setStatus("idle")
       return
     }

     const batchSize = 2
     const delay = 500

     startPulseAnimation()

     for (let i = 0; i < photosToScan; i += batchSize) {
       const currentBatch = assets.slice(i, i + batchSize)

       // Convert to base64 in parallel
       const base64Batch = await Promise.all(
         currentBatch.map((asset) => getBase64FromUri(asset.uri))
       )

       const validAssets = currentBatch.filter((_, index) => base64Batch[index])

       const predictions = await predictWithYusyelModelMulti(
         base64Batch.filter(Boolean)
       )

       //console.log("Predictions:", predictions);
       

const processedResults = await Promise.all(
  validAssets.map(async (asset, index) => {
    try {
      const label = predictions?.[index]?.label ?? "unlabeled"
      const mappedType = mapPredictionToCategory(label)

      // Use existing utility function to remove background directly from asset URI
      const bgRemovedPath = await removeBackgroundFromImageUri(asset.uri)

      return {
        id: asset.id,
        uri: bgRemovedPath || asset.uri, // Use original asset URI as fallback
        type: mappedType,
        label: label,
        category: mappedType,
        addedAt: new Date().toISOString(),
        isManuallyAdded: false,
      }
    } catch (error) {
      console.error("Scan+BG Error:", error)
      return {
        id: asset.id,
        uri: asset.uri, // Use original asset URI
        type: "unlabeled",
        label: "unlabeled",
        addedAt: new Date().toISOString(),
        isManuallyAdded: false,
      }
    }
  })
)

       // Save to wardrobe
       await saveToWardrobe(processedResults)

       setScannedImages((prev) => [...prev, ...processedResults])
       updateCategories(processedResults)

       const progressPercent = Math.min(
         ((i + currentBatch.length) / photosToScan) * 100,
         100
       )
       setProgress(progressPercent)

       await new Promise((resolve) => setTimeout(resolve, delay))
     }

     // Update scan offset
     const newOffset = scanOffset + photosToScan
     setScanOffset(newOffset)
     await saveScanProgress(newOffset, totalPhotosCount)

     setStatus("complete")
     stopPulseAnimation()
   } catch (error) {
     console.error("Error scanning gallery:", error)
     setStatus("idle")
   }
 }

 const getLastScannedAssetId = async () => {
   // This is a helper function to get the last scanned asset ID
   // You might need to store this in AsyncStorage as well
   try {
     const lastScannedId = await AsyncStorage.getItem('@lastScannedAssetId')
     return lastScannedId
   } catch (error) {
     return undefined
   }
 }

 const saveToWardrobe = async (items) => {
   try {
     const existing = JSON.parse(await AsyncStorage.getItem('@smartWardrobeItems')) || []
     const updated = [...existing, ...items]
     await AsyncStorage.setItem('@smartWardrobeItems', JSON.stringify(updated))
   } catch (error) {
     //console.log("Error saving to wardrobe:", error)
   }
 }

 // Update category counts
 const updateCategories = (newItems) => {
   setCategories((prev) => {
     const updated = { ...prev }
     newItems.forEach((item) => {
       if (updated[item.type] !== undefined) {
         updated[item.type] += 1
       }
     })
     return updated
   })
 }

 // Pulse animation for scanning effect
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

 // Progress animation
 useEffect(() => {
   Animated.timing(scanAnimation, {
     toValue: progress / 100,
     duration: 300,
     useNativeDriver: false,
   }).start()
 }, [progress])

 // Scale animation for pulse effect
 const pulseScale = pulseAnimation.interpolate({
   inputRange: [0, 0.5, 1],
   outputRange: [1, 1.2, 1],
 })

 // Opacity animation for pulse effect
 const pulseOpacity = pulseAnimation.interpolate({
   inputRange: [0, 0.5, 1],
   outputRange: [0.7, 1, 0.7],
 })

 // Width for progress bar
 const progressWidth = scanAnimation.interpolate({
   inputRange: [0, 1],
   outputRange: ["0%", "100%"],
 })

 // Navigate back to the previous screen
 const goBack = () => {
  //  router.back()
  navigation.goBack();
 }

 // Continue to wardrobe after scan is complete
 const continueToWardrobe = () => {
  //  router.replace('/(tabs)/explore')
  navigation.navigate('tabs', { screen: 'explore' });
 }

 // Get scan status message
 const getScanStatusMessage = () => {
   if (totalPhotosAvailable === null) {
     return "Loading your photos..."
   }
   
   const remainingPhotos = totalPhotosAvailable - scanOffset
   if (isFirstScan) {
     return `Our AI will scan up to ${BATCH_SIZE} photos from your gallery and automatically identify and categorize clothing items.`
   } else if (remainingPhotos > 0) {
     return `Ready to scan the next batch! You have ${remainingPhotos} photos remaining. We'll scan up to ${BATCH_SIZE} more photos.`
   } else {
     return `All ${totalPhotosAvailable} photos have been scanned! Your wardrobe is complete.`
   }
 }

 const getButtonText = () => {
   if (totalPhotosAvailable === null) {
     return "Loading..."
   } else if (isFirstScan) {
     return "Start Scanning"
   } else if (totalPhotosAvailable - scanOffset > 0) {
     return "Continue Scanning"
   } else {
     return "All Photos Scanned"
   }
 }

 const isButtonDisabled = () => {
   if (totalPhotosAvailable === null) return true
   return totalPhotosAvailable - scanOffset <= 0
 }

 return (
   <SafeAreaView style={styles.container}>
     {/* Header */}
     <View style={styles.header}>
       <TouchableOpacity onPress={goBack} style={styles.backButton}>
         <Image source={require('../../assets/images/back.png')} style={{ height: 30, width: 30, marginVertical: 10 }} />
       </TouchableOpacity>
       <Text style={styles.headerTitle}>
         {status === "idle" ? "Gallery Scan" : status === "scanning" ? "Scanning Gallery..." : "Scan Complete!"}
       </Text>
     </View>

     {/* Main Content */}
     <View style={styles.content}>
       {status === "idle" && (
         <View style={styles.startContainer}>
           <Image source={require("../../assets/images/ai3.png")} style={styles.aiIcon} />
           <Text style={styles.startTitle}>
             {isFirstScan ? "Ready to Scan Your Gallery" : "Continue Gallery Scan"}
           </Text>
           <Text style={styles.startDescription}>
             {getScanStatusMessage()}
           </Text>
           
           {/* Show scan progress */}
           {!isFirstScan && totalPhotosAvailable !== null && (
             <View style={styles.scanProgressContainer}>
               <Text style={styles.scanProgressText}>
                 Progress: {scanOffset} of {totalPhotosAvailable} photos scanned
               </Text>
               <View style={styles.progressBarContainer}>
                 <View 
                   style={[
                     styles.progressBar, 
                     { width: `${(scanOffset / totalPhotosAvailable) * 100}%` }
                   ]} 
                 />
               </View>
             </View>
           )}

           <TouchableOpacity 
             style={[
               styles.startButton,
               isButtonDisabled() && styles.disabledButton
             ]} 
             onPress={startScanning}
             disabled={isButtonDisabled()}
           >
             <Text style={styles.startButtonText}>{getButtonText()}</Text>
           </TouchableOpacity>
         </View>
       )}

       {status === "scanning" && (
         <View style={styles.scanningContainer}>
           {/* Animated scanning circle */}
           <Animated.View
             style={[
               styles.scanCircle,
               {
                 transform: [{ scale: pulseScale }],
                 opacity: pulseOpacity,
               },
             ]}
           >
             <Image source={require("../../assets/images/ai3.png")} style={styles.scanIcon} />
           </Animated.View>

           {/* Scanning text */}
           <Text style={styles.scanningText}>
             {isFirstScan ? "Scanning your gallery..." : "Scanning next batch..."}
           </Text>
           <Text style={styles.scanningSubtext}>{Math.round(progress)}% complete</Text>

           {/* Progress bar */}
           <View style={styles.progressBarContainer}>
             <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
           </View>

           {/* Thumbnail grid animation */}
           <View style={styles.thumbnailGrid}>
             {scannedImages.slice(-12).map((image, index) => (
               <MotiView
                 key={image.id}
                 from={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ type: "timing", duration: 300, delay: index * 50 }}
                 style={styles.thumbnailContainer}
               >
                 <View style={[styles.thumbnail, { backgroundColor: getColorForType(image.type) }]}>
                   <Text style={styles.thumbnailText}>{image?.type?.charAt(0).toUpperCase()}</Text>
                 </View>
               </MotiView>
             ))}
           </View>
         </View>
       )}

       {status === "complete" && (
         <View style={styles.completeContainer}>
           <Image source={require("../../assets/images/ai3.png")} style={styles.completeIcon} />
           <Text style={styles.completeTitle}>
             {isFirstScan ? "Scan Complete!" : "Batch Scan Complete!"}
           </Text>
           <Text style={styles.completeDescription}>
             We've scanned {scannedImages.length} photos and identified {getTotalItems()} clothing items.
             {totalPhotosAvailable - scanOffset > 0 && (
               ` ${totalPhotosAvailable - scanOffset} photos remaining for future scans.`
             )}
           </Text>

           {/* Category breakdown */}
           <View style={styles.categoriesContainer}>
             {Object.entries(categories).map(([category, count]) => (
               <View key={category} style={styles.categoryItem}>
                 <View style={[styles.categoryDot, { backgroundColor: getColorForType(category) }]} />
                 <Text style={styles.categoryText}>
                   {category.charAt(0).toUpperCase() + category.slice(1)}: {count}
                 </Text>
               </View>
             ))}
           </View>

           <TouchableOpacity style={styles.continueButton} onPress={continueToWardrobe}>
             <Text style={styles.continueButtonText}>Continue to Wardrobe</Text>
           </TouchableOpacity>
         </View>
       )}
     </View>
   </SafeAreaView>
 )

 // Helper function to get total items
 function getTotalItems() {
   return Object.values(categories).reduce((sum, count) => sum + count, 0)
 }

 // Helper function to get color for clothing type
 function getColorForType(type) {
   const colors = {
     tops: "#FF6B6B",
     bottoms: "#4ECDC4",
     dresses: "#FFD166",
     shoes: "#6B5B95",
     accessories: "#88D8B0",
   }
   return colors[type] || "#CCCCCC"
 }
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
    marginTop: 30,
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 35,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d36491",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
    fontFamily: "Raleway-Bold",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Start screen styles
  startContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
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
  scanProgressContainer: {
    width: "100%",
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
  },
  scanProgressText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 8,
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
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Raleway-Bold",
  },

  // Scanning screen styles
  scanningContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  scanCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(94, 114, 228, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  scanIcon: {
    width: 50,
    height: 50,
  },
  scanningText: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    marginBottom: 8,
  },
  scanningSubtext: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 24,
    fontFamily: "Raleway-Regular",
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "#EEEEEE",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 32,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#5E72E4",
  },
  thumbnailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    maxWidth: 300,
  },
  thumbnailContainer: {
    width: "25%",
    aspectRatio: 1,
    padding: 4,
  },
  thumbnail: {
    flex: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: 'Raleway-Bold',
  },

  // Complete screen styles
  completeContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
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
  },
  completeDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    color: "#666666",
    fontFamily: "Raleway-Regular",
  },
  categoriesContainer: {
    width: "100%",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 16,
    fontFamily: "Raleway-Regular",
  },
  continueButton: {
    backgroundColor: "#5E72E4",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Raleway-Bold",
  },
})