import { registerRootComponent } from 'expo';
import App from './App';

const previousFatal = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error(
    `[chronicle-native] ${isFatal ? 'FATAL' : 'ERROR'}`,
    error?.message ?? error,
    error?.stack
  );
  previousFatal(error, isFatal);
});

registerRootComponent(App);
