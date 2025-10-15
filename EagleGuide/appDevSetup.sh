#This script is just for our development environment purposes 
#Will install all necassary modules and once complete will open the application through expo 

set -e 

echo "Installing npm if not already"

npm install

echo "Starting installation of necessary packages ... " 
npm install \
  react \
  react-native \
  expo \
  axios \
  @react-navigation/native \
  @react-navigation/native-stack \
  react-native-safe-area-context \
  react-native-screens \
  react-native-gesture-handler \
  react-native-reanimated \
  @expo/vector-icons \
  expo-location \
  expo-constants \
  expo-router \ 
  react-native-dropdown-picker


echo "Opening up application in expo, may need some further packeges installed if prompted" 

npx expo start --tunnel