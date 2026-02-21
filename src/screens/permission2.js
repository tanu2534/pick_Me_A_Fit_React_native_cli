import { useNavigation } from "@react-navigation/native"
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { responsiveFontSize } from "../utility/responsive"
import { Colors } from "../constants/Colors"
import { useState } from "react"
// import { grey100 } from "react-native-paper/lib/typescript/styles/themes/v2/colors"

const permission2 = () => {
  const navigation = useNavigation()
  const [isAIScanEnable, setIsAIScanEnable] = useState(false);
  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.iconContainer}>
          <View style={styles.iconWrapper}>
           <Image source={require("../../assets/images/dressing.png")} style={{height: 30, width: 30}} />
          </View>
        </View>
        <Text style={styles.title}>Add to Wardrobe</Text>
        <Text style={styles.subtitle}>Choose your preferred method to add items to your wardrobe</Text>
      </View>

      {/* Main Cards Section */}
          <View style={{flexDirection: 'row' , height: 300, backgroundColor: 'transparent', justifyContent: 'space-around', alignContent: 'center'}} >

  <TouchableOpacity 
 disabled={!isAIScanEnable}
   onPress={() => { 
    // router.navigate('/scanning', {
    //   screen : 'Gallery Scanning'
    // })
  }} style={[styles.surface,{width: '45%', flexDirection: 'column', height: '90%', borderColor: isAIScanEnable? Colors.peach : Colors.disabledGrey, borderStyle: isAIScanEnable? 'solid':  'dashed', position: 'relative'}]} >
    {!isAIScanEnable && (
      <View style={[styles.badge, !isAIScanEnable ? {borderColor : Colors.disabledGrey} : null]}>
        <Text style={[styles.badgeText, !isAIScanEnable ? {color: Colors.disabledGrey} : null]}>Soon</Text>
      </View>
    )}
    <Image source={require('../../assets/images/hanger.png')} style={{height: 30, width: 30, marginVertical: 10 , tintColor: isAIScanEnable? Colors.peach : Colors.disabledGrey
    }} />
    <View style={styles.inner}>
      <Text style={[styles.cardTitle, {opacity: isAIScanEnable? 1: 0.5, fontSize: responsiveFontSize(isAIScanEnable?20 : 16 )}]}>AI Scan from Gallery</Text>
      <Text style={[styles.cardSubtitle, {opacity: isAIScanEnable? 1:0.5}]}>
        Automatically scan your phone gallery and organize your wardrobe
      </Text>
      {/* <Text style={[styles.cardSubtitle]}> (coming soon)</Text> */}
    </View>
  </TouchableOpacity>
    
      <TouchableOpacity 
      onPress={() => { 
        // router.navigate('/addManually', {
        //   screen : 'Camera Scanning'
        // })
        navigation.navigate('addManually')
      }}
       style={[styles.surface,{width: '45%', flexDirection: 'column', height: '90%', position: 'relative'}]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Recommended</Text>
        </View>
        <Image source={require('../../assets/images/cam.png')} style={{height: 30, width: 30, marginVertical: 10
    }} />
        <View style={styles.inner} >
          <Text style={[styles.cardTitle]}>Add Manually</Text>
          <Text style={[styles.cardSubtitle]}>Take photos or Choose from gallery and organize them yourself</Text>
        </View>
      </TouchableOpacity>
        </View>

      {/* Skip Option */}
      <TouchableOpacity  onPress={() => { navigation.navigate('tabs') }} style={styles.skipCard} activeOpacity={0.7}>
        {/* <Image source={require("../../assets/images/skip.png")} style={styles.skipIcon} /> */}
        <View style={styles.skipContent}>
          <Text style={styles.skipTitle}>Skip setup for now</Text>
          {/* <Text style={styles.skipSubtitle}>Skip this step and come back later</Text> */}
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

export default permission2

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    padding: 25,
  },

  headerContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },

  iconContainer: {
    marginBottom: 20,
  },

  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    // shadowColor: "#d36491",
    // shadowOffset: {
    //   width: 0,
    //   height: 8,
    // },
    // shadowOpacity: 0.15,
    // shadowRadius: 20,
    // elevation: 10,
  },

  iconText: {
    fontSize: 35,
  },

  title: {
    fontSize: responsiveFontSize(26),
    color:Colors.brown,
    marginBottom: 11,
    fontFamily: "Raleway-Bold",
    textAlign: "center",
    lineHeight: responsiveFontSize(32),
  },

  subtitle: {
    fontSize: responsiveFontSize(16),
    color: Colors.brown,
    textAlign: "center",
    fontFamily: "Raleway-Regular",
    lineHeight: responsiveFontSize(22),
    paddingHorizontal: 9,
  },

  cardsContainer: {
    flex: 1,
    gap: 20,
  },

  mainCard: {
    flexDirection: "column",
    padding: 25,
    borderRadius: 20,
    backgroundColor: "#fff",
    shadowColor: "#d36491",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 25,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#f8e8ed",
  },

  aiCard: {
    backgroundColor: "#fff",
    borderLeftWidth: 4,
    borderLeftColor: "#d36491",
  },

  manualCard: {
    backgroundColor: "#fff",
    borderLeftWidth: 4,
    borderLeftColor: "#9b59b6",
  },

  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#fdf1f3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    alignSelf: "flex-start",
  },

  cardIcon: {
    height: 30,
    width: 30,
  },

  cardContent: {
    flex: 1,
  },
surface: { flexDirection: 'row',
   alignItems: 'center', padding: 15, borderRadius: 18,
    backgroundColor: Colors.surface, width: '100%', marginBottom: 25,
    borderWidth: 2, borderColor: Colors.peach

},
  cardTitle: {
    fontSize: responsiveFontSize(20),
    fontFamily: "Raleway-Bold",
    color: "#2c3e50",
    marginBottom: 8,
    alignSelf: "center",
    textAlign:"center"
  },

  cardSubtitle: {
    fontSize: responsiveFontSize(14),
    fontFamily: "Raleway-Regular",
    color: "#7f8c8d",
    lineHeight: responsiveFontSize(20),
    marginBottom: 15,
      textAlign:"center"
  },

  featureContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  featureBadge: {
    backgroundColor: "#fdf1f3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#f4d7e0",
  },

  featureText: {
    fontSize: responsiveFontSize(11),
    fontFamily: "Raleway-Regular",
    color: "#d36491",
  },

  cardArrow: {
    position: "absolute",
    top: 25,
    right: 25,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: "#d36491",
    justifyContent: "center",
    alignItems: "center",
  },

  arrowText: {
    color: "#fff",
    fontSize: responsiveFontSize(16),
    fontFamily: "Raleway-Bold",
  },

  skipCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 15,
    // backgroundColor: "#f8f9fa",
    // borderWidth: 1,
    // borderColor: "#e0e0e0ff",
    marginTop: 10,
    marginBottom: 50,
    justifyContent: 'center'
  },

  skipIcon: {
    height: 24,
    width: 24,
    marginRight: 15,
  },

  skipContent: {
    flex: 1,
  },

  skipTitle: {
    fontSize: responsiveFontSize(16),
    fontFamily: "Raleway-Medium",
    color: Colors.brown,
    marginBottom: 4,
    textAlign:"center",
    opacity:0.8
  },

  skipSubtitle: {
    fontSize: responsiveFontSize(13),
    fontFamily: "Raleway-Regular",
    color: "#adb5bd",
  },
  badge: {
    position: 'absolute',
    top: -5,
    // right: 10,
    backgroundColor: Colors.cream,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    borderWidth: 1,
    borderColor:Colors.peach,
    color: Colors.peach
  },
  badgeText: {
    fontSize: responsiveFontSize(10),
    fontFamily: 'Raleway-Bold',
    color: Colors.peach,
  },
})
