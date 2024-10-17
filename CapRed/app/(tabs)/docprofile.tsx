import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    FlatList,
    ScrollView,
} from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
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

interface UserData {
    patientID: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
}

interface DocProfileProps {
    userId: string;
}

const DocProfile: React.FC<DocProfileProps> = ({ userId }) => {
    const [userData, setUserData] = useState<UserData>({
        patientID: '',
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
    });
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [emailError, setEmailError] = useState<string>('');
    const [phoneError, setPhoneError] = useState<string>('');
    const [addressError, setAddressError] = useState<string>('');
    const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, 'users', userId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data() as UserData);
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                Alert.alert('Error', 'Failed to fetch user data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const handleInputChange = (field: keyof UserData, value: string) => {
        setUserData({ ...userData, [field]: value });
        // Clear errors on input change
        if (field === 'email') setEmailError('');
        if (field === 'phoneNumber') setPhoneError('');
        if (field === 'address') {
            setAddressError('');
            setAddressSuggestions([]); // Clear suggestions when address input changes
        }
    };

    const handleGetLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'Location permission is required to get the address.');
            return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync(location.coords);
        if (address.length > 0) {
            const fullAddress = `${address[0].street}, ${address[0].city}, ${address[0].region}, ${address[0].country}`;
            handleInputChange('address', fullAddress);
            setAddressSuggestions([fullAddress]); // Add the full address to suggestions
        }
    };

    const handleAddressFocus = async () => {
        if (isEditMode) {
            await handleGetLocation();
        }
    };

    const handleAddressSelect = (address: string) => {
        handleInputChange('address', address);
        setAddressSuggestions([]); // Clear suggestions after selection
    };

    const handleSave = async () => {
        // Implement the save logic
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#6A0CAD" />;
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.banner}>
                <View style={styles.profileContainer}>
                    <Icon name="account-circle" size={50} color="#FFFFFF" />
                    <Text style={styles.nameText}>{userData.name || 'User Name'}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.editButton, isEditMode ? styles.editing : styles.notEditing]}
                    onPress={() => setIsEditMode(!isEditMode)}
                >
                    <Icon name="edit" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.userInfo}>
                <Text style={styles.label}>Medical License Number:</Text>
                <View style={styles.inputContainer}>
                    <Icon name="badge" size={20} color="#6A0CAD" />
                    <Text style={styles.value}>{userData.patientID}</Text>
                </View>

                <Text style={styles.label}>Email:</Text>
                <View style={styles.inputContainer}>
                    <Icon name="email" size={20} color="#6A0CAD" />
                    <TextInput
                        style={styles.input}
                        value={userData.email || ''}
                        onChangeText={(text) => handleInputChange('email', text)}
                        keyboardType="email-address"
                        editable={isEditMode}
                    />
                </View>
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                <Text style={styles.label}>Phone Number:</Text>
                <View style={styles.inputContainer}>
                    <Icon name="phone" size={20} color="#6A0CAD" />
                    <TextInput
                        style={styles.input}
                        value={userData.phoneNumber || ''}
                        onChangeText={(text) => handleInputChange('phoneNumber', text)}
                        keyboardType="phone-pad"
                        editable={isEditMode}
                    />
                </View>
                {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

                <Text style={styles.label}>Address:</Text>
                <View style={styles.inputContainer}>
                    <Icon name="home" size={20} color="#6A0CAD" />
                    <TextInput
                        style={styles.input}
                        value={userData.address || ''}
                        onChangeText={(text) => handleInputChange('address', text)}
                        editable={isEditMode}
                        onFocus={handleAddressFocus} // Fetch location on focus
                    />
                </View>
                {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}

                {/* Suggestions List */}
                {addressSuggestions.length > 0 && (
                    <FlatList
                        data={addressSuggestions}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => handleAddressSelect(item)}>
                                <Text style={styles.suggestionText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                        style={styles.suggestionList}
                    />
                )}

                {isEditMode && (
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
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
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    nameText: {
        color: '#FFFFFF',
        fontSize: 20,
        marginLeft: 10,
    },
    editButton: {
        padding: 10,
    },
    editing: {
        backgroundColor: '#FF6347',
    },
    notEditing: {
        backgroundColor: '#6A0CAD',
    },
    userInfo: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 10,
        elevation: 1,
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#6A0CAD',
        marginBottom: 15,
    },
    input: {
        flex: 1,
        padding: 10,
        color: '#000',
    },
    value: {
        padding: 10,
        color: '#000',
    },
    errorText: {
        color: 'red',
        marginTop: 5,
    },
    saveButton: {
        backgroundColor: '#28a745',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    saveButtonText: {
        color: '#FFFFFF',
        textAlign: 'center',
    },
    suggestionList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 5,
        maxHeight: 150,
        elevation: 1,
        marginTop: 5,
    },
    suggestionText: {
        padding: 10,
        fontSize: 16,
        color: '#000',
    },
});

export default DocProfile;
