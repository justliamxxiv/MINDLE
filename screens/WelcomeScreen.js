import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Swiper from 'react-native-swiper';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const swiperRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      id: 1,
      image: require('../assets/Screen1.png'),
      title: 'Welcome to',
      titleHighlight: 'mindle',
      subtitle: 'Your campus community for smarter studying',
    },
    {
      id: 2,
      image: require('../assets/Screen2.png'),
      title: 'Study Smarter, Together',
      subtitle: 'Find study groups, connect with tutors, and ace your exams with your campus crew',
    },
    {
      id: 3,
      image: require('../assets/Screen3.png'),
      title: 'Ready to level up?',
      subtitle: 'Join thousands of students making studying less lonely and way more fun',
      isLast: true,
    },
  ];

  const handleGetStarted = () => {
    navigation.replace('AuthOptions');
  };

  const handleSkip = () => {
    navigation.replace('AuthOptions');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      swiperRef.current?.scrollBy(1);
    }
  };

  return (
    <View className="flex-1 bg-accent">
      <StatusBar style="light" />
      
      {/* Skip Button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity
          onPress={handleSkip}
          className="absolute top-14 right-6 z-10 px-4 py-2"
        >
          <Text className="text-white text-base font-semibold">Skip</Text>
        </TouchableOpacity>
      )}

      <Swiper
        ref={swiperRef}
        loop={false}
        onIndexChanged={(index) => setCurrentIndex(index)}
        showsPagination={false}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} className="flex-1 items-center justify-between px-8 pt-24 pb-32">
            {/* Top Section: Illustration + Text */}
            <View className="flex-1 items-center justify-center">
              {/* Illustration */}
              <View className="mb-8">
                <Image
                  source={slide.image}
                  style={{ width: width * 0.65, height: width * 0.65 }}
                  resizeMode="contain"
                />
              </View>

              {/* Title */}
              <View className="items-center mb-3">
                {slide.titleHighlight ? (
                  <View className="flex-row items-center flex-wrap justify-center">
                    <Text className="text-3xl font-bold text-white text-center">
                      {slide.title}{' '}
                    </Text>
                    <Text
                      style={{ fontFamily: 'Fredoka-SemiBold' }}
                      className="text-3xl text-white"
                    >
                      {slide.titleHighlight}
                    </Text>
                    <Text className="text-3xl font-bold text-white">!</Text>
                  </View>
                ) : (
                  <Text className="text-3xl font-bold text-white text-center">
                    {slide.title}
                  </Text>
                )}
              </View>

              {/* Subtitle */}
              <Text className="text-white text-center text-base leading-6 opacity-90 px-4">
                {slide.subtitle}
              </Text>
            </View>

            {/* Bottom Section: Button (Fixed Position) */}
            <View className="w-full items-center">
              {/* Button Container (Fixed Height to Prevent Jumping) */}
              <View className="w-full mb-6" style={{ height: 56 }}>
                {slide.isLast ? (
                  // Get Started Button (Last Slide)
                  <TouchableOpacity
                    className="bg-white w-full py-4 rounded-xl shadow-lg"
                    onPress={handleGetStarted}
                  >
                    <Text className="text-accent text-center text-lg font-bold">
                      Get Started
                    </Text>
                  </TouchableOpacity>
                ) : (
                  // Next Button (First Two Slides)
                  <TouchableOpacity
                    className="bg-white bg-opacity-20 w-full py-4 rounded-xl border-2 border-white"
                    onPress={handleNext}
                  >
                    <Text className="text-accent text-center text-lg font-semibold">
                      Next
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </Swiper>

      {/* Progress Dots - Fixed Position Outside Swiper */}
      <View className="absolute bottom-24 self-center flex-row items-center justify-center">
        {slides.map((_, dotIndex) => (
          <View
            key={dotIndex}
            className={`h-2 rounded-full mx-1 ${
              dotIndex === currentIndex 
                ? 'w-8 bg-white' 
                : 'w-2 bg-white opacity-40'
            }`}
          />
        ))}
      </View>

      {/* Logo at Bottom */}
      <View className="absolute bottom-8 self-center">
        <Image
          source={require('../assets/Logo2.png')}
          style={{ width: 120, height: 40 }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}