import { registerRootComponent } from 'expo';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { handleRemoteDispatch } from './dispatch';

setBackgroundMessageHandler(getMessaging(), handleRemoteDispatch);

registerRootComponent(App);
