import '@tensorflow/tfjs-react-native';
import '@tensorflow/tfjs-platform-react-native';
import * as tf from '@tensorflow/tfjs';

export const initializeTensorFlow = async () => {
  // Wait for tf to be ready
  await tf.ready();
  console.log('TensorFlow.js is ready!');
  return tf;
};