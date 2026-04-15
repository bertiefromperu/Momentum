import { StyleSheet, Text, View } from 'react-native';

export default function TargetsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Targets</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#F1F5F9', fontSize: 24, fontWeight: '700' },
});