import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import SkeletonContent from 'react-native-skeleton-content';
import { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Surface } from 'react-native-paper';
import { responsiveHeight } from '../utility/responsive';


export default function TabTwoScreen() {
  const [categories, setCategories] = useState([]);
  const [showOptions, setShowOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [categoryModal, setCategoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [fromCategory, setFromCategory] = useState(null);

  const isFocused = useIsFocused();
  const navigation = useNavigation();




  useEffect(() => {
    (async () => {
      setLoading(true);
      const a = await AsyncStorage.getItem('@smartWardrobeItems');
      console.log("All items:", a);
      if (a) {
        const parsed = JSON.parse(a);

        // Group items by category
        const grouped = {};
        parsed.forEach(item => {
          if (!grouped[item.category]) {
            grouped[item.category] = [];
          }

          const formattedItem = { uri: item.uri, id: item.id };

          if (item.isManuallyAdded) {
            // Add manually added items at the front
            grouped[item.category].unshift(formattedItem);
          } else {
            // Add AI items at the end
            grouped[item.category].push(formattedItem);
          }
        });


        // Format the grouped data
        const formatted = Object.keys(grouped).map(category => ({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          number: grouped[category].length,
          id: category,
          image: grouped[category], //  already has uri + id
        }));

        setCategories(formatted);
      }

      setLoading(false);
    })();
  }, [isFocused]);


  // Helper functions
  const editItem = async (item, categoryName) => {
    try {
      console.log("Removing item from UI + Storage:", item);

      // Update state
      const updatedCategories = categories.map(category => {
        if (category.name.toLowerCase() === categoryName.toLowerCase()) {
          const filteredImages = category.image.filter(i => i.uri !== item.uri);
          return {
            ...category,
            image: filteredImages,
            number: filteredImages.length,
            id: category.id
          };
        }
        return category;
      }).filter(cat => cat.image.length > 0);

      setCategories(updatedCategories);

      // Update AsyncStorage
      const raw = await AsyncStorage.getItem('@smartWardrobeItems');
      console.log("Raw storage before:", raw);
      const allItems = JSON.parse(raw) || [];

      console.log("Item ID to remove:", item.id);
      const filteredItems = allItems.filter(i => i.id !== item.id);
      console.log("Items after filter:", filteredItems);

      await AsyncStorage.setItem('@smartWardrobeItems', JSON.stringify(filteredItems));
      console.log("Updated storage saved successfully.");
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };


  const moveToDifferentCategory = async (item, fromCategory, toCategory) => {
    try {
      // 1. Update category on the item
      const updatedItem = { ...item, category: toCategory.toLowerCase() };

      // 2. Update AsyncStorage
      const allItems = JSON.parse(await AsyncStorage.getItem('@smartWardrobeItems')) || [];
      console.log("All items:", allItems);


      const updatedAllItems = allItems.map(i =>
        i.id === item.id ? updatedItem : i
      );

      await AsyncStorage.setItem('@smartWardrobeItems', JSON.stringify(updatedAllItems));

      // 3. Update categories state
      const updatedCategories = [];

      categories.forEach(category => {
        if (category.name.toLowerCase() === fromCategory.toLowerCase()) {
          const filtered = category.image.filter(i => i.uri !== item.uri);
          if (filtered.length > 0) {
            updatedCategories.push({
              ...category,
              image: filtered,
              id: category.id,
              number: filtered.length,
            });
          }
        } else if (category.name.toLowerCase() === toCategory.toLowerCase()) {
          updatedCategories.push({
            ...category,
            image: [...category.image, { uri: item.uri }],
            number: category.number + 1,
            id: category.id
          });
        } else {
          updatedCategories.push(category);
        }
      });

      // If new category didn't exist, create it
      if (!updatedCategories.find(cat => cat.name.toLowerCase() === toCategory.toLowerCase())) {
        updatedCategories.push({
          name: toCategory.charAt(0).toUpperCase() + toCategory.slice(1),
          number: 1,
          image: [{ uri: item.uri }],
          id: toCategory.toLowerCase()

        });
      }

      setCategories(updatedCategories);
      console.log(`Item moved from ${fromCategory} → ${toCategory}`);
    } catch (error) {
      console.error("Error moving item:", error);
    }
  };



  const moveItem = (item, categoryName) => {
    console.log("Move item:", item, "from category:", categoryName);
    setSelectedItem(item);
    setFromCategory(categoryName);
    setCategoryModal(true);

  };


  return (
    <View style={styles.container}>
      <View style={styles.profile}>
        <TouchableOpacity

          onPress={() => { navigation.navigate('Home') }} style={{ flexDirection: 'row', alignItems: 'center' }}>

          <Image source={require('../../assets/images/back.png')} style={{ height: 30, width: 30, marginVertical: 10 }} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '500', marginVertical: 10, fontFamily: 'Raleway-Bold' }}>Wardrobe</Text>
      </View>

      <Text style={{ fontSize: 12, fontWeight: '400', marginVertical: 10, fontFamily: 'Raleway-Regular', paddingHorizontal: 10, justifyContent: 'center' }}>Your wardrobe is ready to be organized. Long press on an item to move it to a different category or remove it.</Text>
{true && (
  <ScrollView style={{ padding: 10 }}>
    {[1, 2, 3].map((_, index) => (
      <Surface
        key={index}
        elevation={1}
        style={{
          marginVertical: 10,
          borderRadius: 10,
          backgroundColor: '#fff',
          padding: 15,
        }}
      >
        <SkeletonContent
          containerStyle={{ flex: 1 }}
          isLoading={true}
          layout={[
            { key: 'title' + index, width: 100, height: 20, marginBottom: 25 },
            { key: 'count' + index, width: 40, height: 20, marginBottom: 15 },
            ...[1, 2, 3].map((__, imgIndex) => ({
              key: `img${index}-${imgIndex}`,
              width: 120,
              height: 120,
              marginRight: 10,
            })),
          ]}
          boneColor="#e0e0e0"
          highlightColor="#f4f4f4"
        >
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: 100, height: 20, borderRadius: 10 }} />
              <View style={{ width: 40, height: 20, borderRadius: 10 }} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 25 }}>
              {[1, 2, 3].map((__, imgIndex) => (
                <View key={imgIndex} style={{ marginRight: 10 }}>
                  <View style={{ width: 120, height: 120, borderRadius: 10 }} />
                </View>
              ))}
            </ScrollView>
          </View>
        </SkeletonContent>
      </Surface>
    ))}
  </ScrollView>
)}



      <ScrollView>
        <View style={{ flexDirection: 'column', paddingHorizontal: 10 }}>
          {categories.map((category, index) => (
            <Surface elevation={1} key={index} style={{ marginVertical: 10, flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10 }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 20, fontWeight: '500', marginVertical: 10, fontFamily: 'Raleway-Bold' }}>{category.name}</Text>
                <Text style={{ fontSize: 20, fontWeight: '400', marginVertical: 10, fontFamily: 'Raleway-Regular', color: '#d36491' }}>{category.number}</Text>
              </View>

              <ScrollView
                horizontal
                style={{
                  marginVertical: 10,
                  alignSelf: 'baseline',
                  flexDirection: 'row',
                  gap: 5
                }}
              >
                {category?.image?.map((item, itemIndex) => {
                  // Unique key har item ke liye
                  const uniqueKey = `${index}-${itemIndex}`;

                  return (
                    <TouchableOpacity
                      key={itemIndex}
                      onLongPress={() => {
                        console.log("Long pressed");
                        setShowOptions(prev => ({
                          ...prev,
                          [uniqueKey]: !prev[uniqueKey] // Sirf is specific item ke liye toggle
                        }));
                      }}
                      onPress={() => {
                        console.log("Pressed");
                        setShowOptions(prev => ({
                          ...prev,
                          [uniqueKey]: false // Sirf is item ke options hide karo
                        }));
                      }}
                      style={{ position: 'relative' }} // Important for absolute positioning
                    >
                      <Image
                        source={{ uri: item.uri ? item.uri : item }}
                        style={{
                          width: 150,
                          height: 150,
                          resizeMode: 'cover',
                          marginHorizontal: 10,
                          borderRadius: 10,
                        }}
                      />

                      {/* Sirf is specific item ke liye options show karo */}
                      {showOptions[uniqueKey] && (
                        <View style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          left: 5,
                          backgroundColor: '#fff',
                          borderRadius: 10,
                          elevation: 5,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 4,
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          zIndex: 999,
                          minWidth: 180, // Minimum width for better UI
                        }}>
                          <TouchableOpacity
                            onPress={() => {
                              setShowOptions(prev => ({
                                ...prev,
                                [uniqueKey]: false
                              }));
                              // Edit item function call kariye
                              editItem(item, category.name);
                            }}
                          >
                            <Text style={{
                              fontSize: 16,
                              fontFamily: 'Raleway-SemiBold',
                              paddingVertical: 5
                            }}>
                              Remove item
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              setShowOptions(prev => ({
                                ...prev,
                                [uniqueKey]: false
                              }));
                              // Move to different category
                              moveItem(item, category.name);
                            }}
                          >
                            <Text style={{
                              fontSize: 16,
                              fontFamily: 'Raleway-SemiBold',
                              paddingVertical: 5
                            }}>
                              Move to different category
                            </Text>
                          </TouchableOpacity>

                          {/* <TouchableOpacity 
                      onPress={() => {
                        setShowOptions(prev => ({
                          ...prev,
                          [uniqueKey]: false
                        }));
                        // Delete item
                        deleteItem(item, category.name);
                      }}
                    >
                      <Text style={{ 
                        fontSize: 16, 
                        fontFamily: 'Raleway-SemiBold', 
                        paddingVertical: 5, 
                        color: 'red' 
                      }}>
                       
                      </Text>
                    </TouchableOpacity> */}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Surface>
          ))}
          {categories.length === 0 && (
            <Text style={{ fontSize: 20, fontWeight: '500', marginVertical: 10, fontFamily: 'Raleway-Bold' }}>No items found.</Text>
          )}
        </View>
      </ScrollView>

      <Modal visible={categoryModal} transparent animationType="slide" onRequestClose={() => setCategoryModal(false)}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)',  // semi-transparent background
        }}>
          <View style={{
            width: '80%',
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10
          }}>
            <Text style={{ fontSize: 18, marginBottom: 15, fontFamily: 'Raleway-Bold' }}>Move item to category</Text>

            {categories.map((cat, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  moveToDifferentCategory(selectedItem, fromCategory, cat.name);
                  setCategoryModal(false);
                  setSelectedItem(null);
                  setFromCategory(null);
                }}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  backgroundColor: 'white',
                  marginBottom: 10,
                  borderRadius: 5
                }}
              >
                <Text style={{ fontSize: 16, fontFamily: 'Raleway-Regular' }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={() => setCategoryModal(false)}>
              <Text style={{ color: 'red', textAlign: 'center', marginTop: 10 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    backgroundColor: '#fff'
  },
  profile: {
    height: responsiveHeight(8),
    width: '100%',
    // backgroundColor: '#d36491',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#9a9797',
  }
});
