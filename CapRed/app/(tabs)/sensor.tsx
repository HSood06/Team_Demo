import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Location from 'expo-location';

// Replace with your actual Firebase configuration
const firebaseConfig = {
    authDomain: "proto2-582ef.firebaseapp.com",
    projectId: "proto2-582ef",
    storageBucket: "proto2-582ef.appspot.com",
    messagingSenderId: "781067500172",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Define a type for the sensor data
interface Sensor {
    id: string;
    name: string;
}

const Sensors: React.FC = () => {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchSensors();
    }, []);

    const fetchSensors = async () => {
        setLoading(true);
        try {
            const sensorsCollection = collection(db, 'sensors');
            const sensorSnapshot = await getDocs(sensorsCollection);
            const sensorList: Sensor[] = sensorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sensor));
            setSensors(sensorList);
        } catch (error) {
            console.error('Error fetching sensors:', error);
            Alert.alert('Error', 'Failed to fetch sensors');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSensor = async () => {
        // Request location permission as it is necessary for Bluetooth operations
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission denied', 'Location permission is required to use Bluetooth scanning.');
            return;
        }

        // Open Bluetooth settings (this will open the app settings)
        Linking.openSettings();
    };

    const handleForgetSensor = async (sensorId: string) => {
        try {
            await deleteDoc(doc(db, 'sensors', sensorId));
            setSensors(sensors.filter(sensor => sensor.id !== sensorId));
            Alert.alert('Success', 'Sensor forgotten successfully!');
        } catch (error) {
            console.error('Error forgetting sensor:', error);
            Alert.alert('Error', 'Failed to forget sensor');
        }
    };

    const handleRefresh = () => {
        Alert.alert('Refresh', 'Re-scanning for Bluetooth devices is not implemented.');
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#6A0CAD" />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.banner}>
                <Text style={styles.title}>Sensors</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddSensor}>
                    <Icon name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {sensors.length === 0 ? (
                <Text style={styles.message}>Please pair a sensor to continue..</Text>
            ) : (
                <View style={styles.sensorList}>
                    {sensors.map(sensor => (
                        <View key={sensor.id} style={styles.sensorItem}>
                            <Text style={styles.sensorText}>{sensor.name}</Text>
                            <View style={styles.actions}>
                                <TouchableOpacity onPress={() => handleForgetSensor(sensor.id)} style={styles.actionButton}>
                                    <Text style={styles.actionText}>Forget</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleRefresh} style={styles.actionButton}>
                                    <Text style={styles.actionText}>Refresh</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F5F5F5',
    },
    banner: {
        backgroundColor: '#6A0CAD',
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        marginBottom: 20,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        flex: 1,
    },
    addButton: {
        padding: 10,
    },
    message: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 18,
        color: '#6A0CAD',
    },
    sensorList: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 10,
        elevation: 1,
    },
    sensorItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    sensorText: {
        color: '#000',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    actionButton: {
        padding: 10,
        backgroundColor: '#FF6347',
        borderRadius: 5,
    },
    actionText: {
        color: '#FFFFFF',
    },
});

export default Sensors;
