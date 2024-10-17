import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
  weight?: string; // kg
  height?: string; // cm
  phoneNumber?: string;
  address?: string;
}

interface MyProfileProps {
  userId: string;
}

const MyProfile: React.FC<MyProfileProps> = ({ userId }) => {
  const [userData, setUserData] = useState<UserData>({
    patientID: '',
    name: '',
    email: '',
    weight: '',
    height: '',
    phoneNumber: '',
    address: '',
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [weightError, setWeightError] = useState('');
  const [heightError, setHeightError] = useState('');
  const [isImperial, setIsImperial] = useState(false); // State for units

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            patientID: data.patientID || '',
            name: data.name || '',
            email: data.email || '',
            weight: data.weight || '',
            height: data.height || '',
            phoneNumber: data.phoneNumber || '',
            address: data.address || '',
          } as UserData);
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to fetch user data');
      }
    };

    fetchData();
  }, [userId]);

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData({ ...userData, [field]: value });
    // Clear errors on input change
    if (field === 'email') setEmailError('');
    if (field === 'phoneNumber') setPhoneError('');
    if (field === 'weight') setWeightError('');
    if (field === 'height') setHeightError('');
  };

  const isEmailValid = (email: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const checkEmailInUse = async (email: string) => {
    const q = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // Returns true if email is already in use
  };

  const isPhoneNumberValid = (phone: string) => {
    const phonePattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phonePattern.test(phone);
  };

  const isPositiveNumber = (value: string) => {
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue > 0;
  };

  const handleSave = async () => {
    if (!isEmailValid(userData.email || '')) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    if (await checkEmailInUse(userData.email || '')) {
      setEmailError('This email is already in use.');
      return;
    }

    if (!isPhoneNumberValid(userData.phoneNumber || '')) {
      setPhoneError('Please enter a valid phone number.');
      return;
    }

    if (!isPositiveNumber(userData.weight || '')) {
      setWeightError('Weight must be a positive number.');
      return;
    }

    if (!isPositiveNumber(userData.height || '')) {
      setHeightError('Height must be a positive number.');
      return;
    }

    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        name: userData.name,
        email: userData.email,
        weight: userData.weight,
        height: userData.height,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
      });
      Alert.alert('Success', 'Data updated successfully!');
      setIsEditMode(false);
      const updatedDocSnap = await getDoc(docRef);
      if (updatedDocSnap.exists()) {
        const updatedData = updatedDocSnap.data();
        setUserData({
          patientID: updatedData.patientID || '',
          name: updatedData.name || '',
          email: updatedData.email || '',
          weight: updatedData.weight || '',
          height: updatedData.height || '',
          phoneNumber: updatedData.phoneNumber || '',
          address: updatedData.address || '',
        } as UserData);
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save user data');
    }
  };

  const convertMetrics = () => {
    // Convert both weight and height based on the current unit state
    const weightInKg = parseFloat(userData.weight || '0');
    const heightInCm = parseFloat(userData.height || '0');

    if (isImperial) {
      if (!isNaN(weightInKg)) {
        setUserData({ ...userData, weight: ((weightInKg * 2.20462).toFixed(2)).toString() }); // Convert to lbs
      }
      if (!isNaN(heightInCm)) {
        setUserData({ ...userData, height: ((heightInCm / 2.54).toFixed(2)).toString() }); // Convert to inches
      }
    } else {
      if (!isNaN(weightInKg)) {
        setUserData({ ...userData, weight: ((weightInKg / 2.20462).toFixed(2)).toString() }); // Convert to kg
      }
      if (!isNaN(heightInCm)) {
        setUserData({ ...userData, height: ((heightInCm * 2.54).toFixed(2)).toString() }); // Convert to cm
      }
    }
    setIsImperial(!isImperial); // Toggle the unit
  };

  return (
    <View style={styles.container}>
      {/* Purple Banner */}
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
        <Text style={styles.label}>Patient ID:</Text>
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

        {/* Combined Weight and Height Container */}
        <View>
          <Text style={styles.label}>Weight ({isImperial ? 'Lbs' : 'KG'}):</Text>
          <View style={styles.inputContainer}>
            <Icon name="fitness-center" size={20} color="#6A0CAD" />
            <TextInput
              style={styles.input}
              value={userData.weight || ''}
              onChangeText={(text) => handleInputChange('weight', text)}
              keyboardType="numeric"
              editable={isEditMode}
            />
          </View>
          {weightError ? <Text style={styles.errorText}>{weightError}</Text> : null}

          <Text style={styles.label}>Height ({isImperial ? 'Inches' : 'CM'}):</Text>
          <View style={styles.inputContainer}>
            <Icon name="height" size={20} color="#6A0CAD" />
            <TextInput
              style={styles.input}
              value={userData.height || ''}
              onChangeText={(text) => handleInputChange('height', text)}
              keyboardType="numeric"
              editable={isEditMode}
            />
          </View>
          {heightError ? <Text style={styles.errorText}>{heightError}</Text> : null}

          <TouchableOpacity onPress={convertMetrics} style={styles.convertButton}>
            <Text style={styles.convertButtonText}>Convert</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Address:</Text>
        <View style={styles.inputContainer}>
          <Icon name="home" size={20} color="#6A0CAD" />
          <TextInput
            style={styles.input}
            value={userData.address || ''}
            onChangeText={(text) => handleInputChange('address', text)}
            editable={isEditMode}
          />
        </View>

        {isEditMode && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>
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

  convertButton: {
    backgroundColor: '#6A0CAD',
    padding: 5,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  convertButtonText: {
    color: '#FFFFFF',
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
});

export default MyProfile;
