import { db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const saveCard = async (cardData, currentUser) => {
  if (!currentUser) {
    toast.error('Please login to save cards');
    return null;
  }

  try {
    const cardWithMetadata = {
      ...cardData,
      createdAt: Date.now(),
      createdAtServer: serverTimestamp(),
      userId: currentUser.uid
    };

    const cardsCol = collection(db, 'users', currentUser.uid, 'savedCards');
    const docRef = await addDoc(cardsCol, cardWithMetadata);
    toast.success('Card saved successfully!');
    return docRef.id;
  } catch (error) {
    console.error('Error saving card:', error);
    toast.error('Failed to save card');
    return null;
  }
};

export const useCardSave = () => {
  const { currentUser } = useAuth();
  
  const saveUserCard = async (cardData) => {
    return await saveCard(cardData, currentUser);
  };
  
  return { saveUserCard };
};
