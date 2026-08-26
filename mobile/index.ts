import { registerRootComponent } from 'expo';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { handleRemoteDispatch } from './dispatch';

const previousFatal = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error(
    `[chronicle-native] ${isFatal ? 'FATAL' : 'ERROR'}`,
    error?.message ?? error,
    error?.stack
  );
  previousFatal(error, isFatal);
});

setBackgroundMessageHandler(getMessaging(), handleRemoteDispatch);

registerRootComponent(App);
