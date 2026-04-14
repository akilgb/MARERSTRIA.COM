import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth, onAuthStateChanged } from '../firebase';

export function useFirebaseData() {
  const [user, setUser] = useState(auth.currentUser);
  const [schools, setSchools] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setSchools([]);
      setCourses([]);
      setSessions([]);
      return;
    }

    const qSchools = query(collection(db, 'schools'), where('userId', '==', user.uid));
    const unsubscribeSchools = onSnapshot(qSchools, (snapshot) => {
      setSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching schools:", error);
    });

    const qCourses = query(collection(db, 'courses'), where('userId', '==', user.uid));
    const unsubscribeCourses = onSnapshot(qCourses, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching courses:", error);
    });

    const qSessions = query(collection(db, 'sessions'), where('userId', '==', user.uid));
    const unsubscribeSessions = onSnapshot(qSessions, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching sessions:", error);
    });

    return () => {
      unsubscribeSchools();
      unsubscribeCourses();
      unsubscribeSessions();
    };
  }, [user]);

  return { user, schools, courses, sessions };
}
