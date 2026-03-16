import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Library, 
  User, 
  Shield, 
  LogOut, 
  Search, 
  Calendar, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Briefcase,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Ban,
  Unlock,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { User as UserType, Visit, Stats } from './types';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit, 
  getDocs, 
  updateDoc,
  handleFirestoreError,
  OperationType
} from './firebase';
import { Timestamp } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error && parsed.error.includes('insufficient permissions')) {
          message = "You don't have permission to perform this action. Please contact the administrator.";
        }
      } catch (e) {
        // Not a JSON error
      }
      return (
        <div className="min-h-screen bg-[#3E2723] flex items-center justify-center p-6 text-white text-center">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/20">
            <AlertCircle size={64} className="mx-auto mb-6 text-red-400" />
            <h2 className="text-2xl font-black mb-4">Application Error</h2>
            <p className="text-white/60 mb-8">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#8D6E63] py-4 rounded-2xl font-black hover:bg-[#A1887F] transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LOGO_URL = "https://drive.google.com/thumbnail?id=163dNIQbB7SiwOt_XDxF9jNO3groZ8hPO&sz=w1000";
const BG_URL = "https://drive.google.com/thumbnail?id=1So_ECca4DzYJPStZuXkBU5Bcqn5BDfaS&sz=w1920";

interface DashboardWrapperProps {
  currentUser: UserType | null;
  userType: string;
  setUserType: (type: any) => void;
  collegeOffice: string;
  setCollegeOffice: (val: string) => void;
  handleProfileSetup: (e: React.FormEvent) => void;
  handleLogVisit: (e: React.FormEvent) => void;
  reason: string;
  setReason: (val: string) => void;
  navigate: (path: string) => void;
}

const DashboardWrapper = ({ 
  currentUser, 
  userType, 
  setUserType, 
  collegeOffice, 
  setCollegeOffice, 
  handleProfileSetup, 
  handleLogVisit, 
  reason, 
  setReason, 
  navigate 
}: DashboardWrapperProps) => {
  if (!currentUser) return <Navigate to="/login" />;
  
  if (!currentUser.user_type || !currentUser.college_office) {
    return (
      <motion.div 
        key="profile"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-md w-full mx-auto"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-white/20 text-white">
          <h2 className="font-serif text-3xl font-black tracking-tight mb-2">Profile Setup</h2>
          <p className="text-white/60 mb-8 font-medium">Tell us more about yourself.</p>

          <form onSubmit={handleProfileSetup} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">I am a...</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'student', label: 'Student', icon: GraduationCap },
                  { id: 'faculty', label: 'Faculty', icon: BookOpen },
                  { id: 'admin', label: 'Admin', icon: Shield }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setUserType(t.id as any)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all active:scale-95 ${
                      userType === t.id 
                        ? 'border-[#8D6E63] bg-[#8D6E63] text-white shadow-lg' 
                        : 'border-white/10 bg-white/5 hover:border-white/30 text-white'
                    }`}
                  >
                    <t.icon size={28} />
                    <span className="text-[10px] font-black uppercase tracking-wider">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">College / Office</label>
              <select 
                value={collegeOffice}
                onChange={(e) => setCollegeOffice(e.target.value)}
                className="w-full px-5 py-4 bg-white/5 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-white"
                required
              >
                <option value="" disabled className="bg-[#3E2723]">Select College / Office</option>
                {[
                  "College of Accountancy",
                  "College of Agriculture",
                  "College of Arts and Sciences",
                  "College of Business Administration",
                  "College of Communication",
                  "College of Informatics and Computing Studies",
                  "College of Criminology",
                  "College of Education",
                  "College of Engineering and Architecture",
                  "College of Medical Technology",
                  "College of Music",
                  "College of Nursing",
                  "College of Physical Therapy",
                  "College of Respiratory Therapy",
                  "School of International Relations",
                  "Others"
                ].map(college => (
                  <option key={college} value={college} className="bg-[#3E2723]">{college}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#8D6E63] text-white py-4 rounded-2xl font-black text-lg hover:bg-[#A1887F] transition-all shadow-xl flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={20} />
            </button>

            <button 
              type="button"
              onClick={() => navigate('/role-selection')}
              className="w-full mt-4 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors"
            >
              Back to Role Selection
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      key="log"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-white/20 text-white">
        <h2 className="font-serif text-3xl font-black tracking-tight mb-2">Library Entry</h2>
        <p className="text-white/60 mb-8 font-medium">Select your purpose for today.</p>

        <form onSubmit={handleLogVisit} className="space-y-3">
          {[
            'Reading',
            'Research',
            'Use of Computer',
            'Studying',
            'Borrowing/Returning Books',
            'Other'
          ].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`w-full text-left px-6 py-4 rounded-2xl border transition-all flex justify-between items-center group active:scale-[0.98] ${
                reason === r 
                  ? 'border-[#8D6E63] bg-[#8D6E63] text-white shadow-lg' 
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className="font-bold tracking-tight">{r}</span>
              {reason === r ? <CheckCircle2 size={20} /> : <ChevronRight size={18} className="opacity-20 group-hover:opacity-100 transition-opacity" />}
            </button>
          ))}

          <button 
            type="submit"
            disabled={!reason}
            className="w-full bg-[#8D6E63] text-white py-5 rounded-2xl font-black text-xl mt-6 hover:bg-[#A1887F] disabled:opacity-50 transition-all shadow-xl active:scale-95"
          >
            Log Visit
          </button>
        </form>
      </div>

      {/* User History Section */}
      <div className="bg-black/20 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-white/5 text-white flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-serif text-2xl font-black tracking-tight">My Records</h3>
          <div className="bg-[#8D6E63]/20 border border-[#8D6E63]/30 px-4 py-2 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#A1887F]">Total Visits</p>
            <p className="text-2xl font-black leading-none mt-1">{currentUser?.visitCount || 0}</p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-[400px]">
          {currentUser?.history && currentUser.history.length > 0 ? (
            currentUser.history.map((visit, i) => (
              <motion.div 
                key={visit.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-sm">{visit.reason}</p>
                  <p className="text-[10px] text-white/40 font-medium">{new Date(visit.timestamp).toLocaleDateString()}</p>
                </div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                  {new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-20 py-10">
              <Calendar size={48} className="mb-4" />
              <p className="font-bold">No records yet</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Profile Setup State
  const [userType, setUserType] = useState<string>('');
  const [collegeOffice, setCollegeOffice] = useState('');

  // Visit Log State
  const [reason, setReason] = useState('');
  
  const handleRoleSelect = (selectedRole: 'student' | 'faculty' | 'admin') => {
    setError('');
    const isAdminEmail = currentUser?.email === 'eunice.mabasa@neu.edu.ph' || currentUser?.email === 'jcesperanza@neu.edu.ph';
    
    if (selectedRole === 'admin') {
      if (isAdminEmail) {
        setUserType('admin');
        navigate('/admin-dashboard');
      } else {
        const msg = 'Access Denied: Only authorized administrators can access the Admin dashboard.';
        setError(msg);
        alert(msg);
      }
    } else if (selectedRole === 'faculty') {
      if (isAdminEmail) {
        setUserType('faculty');
        navigate('/faculty-dashboard');
      } else {
        const msg = 'Access Denied: Only authorized personnel can access the Faculty dashboard.';
        setError(msg);
        alert(msg);
      }
    } else if (selectedRole === 'student') {
      setUserType('student');
      navigate('/student-dashboard');
    }
  };

  // Admin State
  const [stats, setStats] = useState<Stats | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [allUsers, setAllUsers] = useState<UserType[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!user.email?.endsWith('@neu.edu.ph') && user.email !== 'eunice.mabasa@neu.edu.ph' && user.email !== 'jcesperanza@neu.edu.ph') {
          setError('Please use your institutional email (@neu.edu.ph)');
          await signOut(auth);
          setLoading(false);
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserType;
            if (userData.is_blocked && userData.role !== 'admin') {
              setError('Your access to the library has been blocked.');
              await signOut(auth);
              setLoading(false);
              return;
            }
            setCurrentUser({ ...userData, uid: user.uid });
            if (location.pathname === '/' || location.pathname === '/login') {
              navigate('/role-selection');
            }
          } else {
            // New User
            const isDefaultAdmin = user.email === 'eunice.mabasa@neu.edu.ph' || user.email === 'jcesperanza@neu.edu.ph';
            const newUser: UserType = {
              uid: user.uid,
              email: user.email!,
              name: user.displayName || user.email!.split('@')[0],
              role: isDefaultAdmin ? 'admin' : 'user',
              user_type: isDefaultAdmin ? 'admin' : null,
              college_office: null,
              is_blocked: false,
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(doc(db, 'users', user.uid), newUser);
              setCurrentUser(newUser);
              navigate('/role-selection');
            } catch (setErr) {
              if (isDefaultAdmin) {
                setCurrentUser(newUser);
                navigate('/role-selection');
              } else {
                throw setErr;
              }
            }
          }
        } catch (err) {
          if (user.email === 'eunice.mabasa@neu.edu.ph' || user.email === 'jcesperanza@neu.edu.ph') {
            const fallbackAdmin: UserType = {
              uid: user.uid,
              email: user.email!,
              name: user.displayName || 'Admin',
              role: 'admin',
              user_type: 'admin',
              college_office: 'Library',
              is_blocked: false,
              createdAt: new Date().toISOString()
            };
            setCurrentUser(fallbackAdmin);
            navigate('/role-selection');
          } else {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          }
        }
      } else {
        setCurrentUser(null);
        if (location.pathname !== '/' && location.pathname !== '/login') {
          navigate('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType || !collegeOffice) {
      setError('Please fill in all fields');
      return;
    }

    if (!currentUser) return;

    try {
      console.log('Updating profile for user:', currentUser.uid, 'Type:', userType, 'Office:', collegeOffice);
      await setDoc(doc(db, 'users', currentUser.uid), {
        user_type: userType,
        college_office: collegeOffice
      }, { merge: true });
      
      console.log('Profile updated in Firestore. Updating local state...');
      setCurrentUser(prev => prev ? { ...prev, user_type: userType as any, college_office: collegeOffice } : null);
      setError('');
      
      // Immediate redirect to the designated dashboard path
      console.log('Redirecting to dashboard:', `/${userType}-dashboard`);
      navigate(`/${userType}-dashboard`, { replace: true });
    } catch (err) {
      console.error('Profile setup error:', err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleLogVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    if (!currentUser) return;

    try {
      await addDoc(collection(db, 'visits'), {
        user_email: currentUser.email,
        user_name: currentUser.name,
        user_type: currentUser.user_type,
        college_office: currentUser.college_office,
        reason,
        timestamp: Timestamp.now()
      });
      navigate('/welcome');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'visits');
    }
  };

  const handleBlockUser = async (uid: string, isBlocked: boolean) => {
    try {
      await setDoc(doc(db, 'users', uid), { is_blocked: isBlocked }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleChangeRole = async (uid: string, newRole: 'admin' | 'user') => {
    try {
      await setDoc(doc(db, 'users', uid), { role: newRole }, { merge: true });
      if (uid === currentUser?.uid) {
        setCurrentUser(prev => prev ? { ...prev, role: newRole } : null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
    setReason('');
    setError('');
  };

  // Real-time Stats and Data for Admin
  useEffect(() => {
    if (location.pathname !== '/admin-dashboard' || !currentUser || (currentUser.role !== 'admin' && currentUser.email !== 'eunice.mabasa@neu.edu.ph' && currentUser.email !== 'jcesperanza@neu.edu.ph')) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Visits listener
    let visitsQuery = query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
    
    if (dateRange.start) {
      visitsQuery = query(visitsQuery, where('timestamp', '>=', Timestamp.fromDate(new Date(dateRange.start))));
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      visitsQuery = query(visitsQuery, where('timestamp', '<=', Timestamp.fromDate(end)));
    }

    const unsubscribeVisits = onSnapshot(visitsQuery, (snapshot) => {
      const visitsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp).toDate().toISOString()
      })) as any[];
      
      setVisits(visitsData);

      // Calculate stats for today
      const todayVisits = visitsData.filter(v => new Date(v.timestamp) >= today);
      setStats({
        totalVisitsToday: todayVisits.length,
        studentVisits: todayVisits.filter(v => v.user_type === 'student').length,
        facultyVisits: todayVisits.filter(v => v.user_type === 'faculty').length,
        adminVisits: todayVisits.filter(v => v.user_type === 'admin').length,
      });
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'visits');
    });

    // Users listener
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserType[];
      setAllUsers(usersData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    });

    return () => {
      unsubscribeVisits();
      unsubscribeUsers();
    };
  }, [location.pathname, dateRange, currentUser]);

  // Real-time history for current user
  useEffect(() => {
    if (!currentUser || (location.pathname !== '/student-dashboard' && location.pathname !== '/faculty-dashboard')) return;

    const q = query(
      collection(db, 'visits'), 
      where('user_email', '==', currentUser.email),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp).toDate().toISOString()
      })) as any[];
      
      setCurrentUser(prev => prev ? { ...prev, history, visitCount: snapshot.size } : null);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'visits');
    });

    return () => unsubscribe();
  }, [currentUser?.email, location.pathname]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen relative overflow-x-hidden font-sans">
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#3E2723] flex flex-col items-center justify-center text-white"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl p-4"
            >
              <img 
                src={LOGO_URL} 
                alt="NEU" 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-[#3E2723] font-black text-2xl">NEU</span>';
                }}
              />
            </motion.div>
            <h2 className="font-serif text-3xl font-black tracking-tight mb-4 text-center px-6">Loading New Era University Library</h2>
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-3 h-3 bg-[#D7CCC8] rounded-full"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BG_URL})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#3E2723]/95 via-[#3E2723]/80 to-black/90 backdrop-blur-[2px]" />
      </div>

      {/* Header */}
      <nav className="relative z-50 bg-white/5 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-xl overflow-hidden"
          >
            <img 
              src={LOGO_URL} 
              alt="NEU Logo" 
              className="w-full h-full object-contain drop-shadow-2xl"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-white font-black text-xs">NEU</span>';
              }}
            />
          </motion.div>
          <div>
            <h1 className="font-serif font-black text-xl text-[#D7CCC8] tracking-tight leading-none uppercase">New Era University Library</h1>
            <p className="text-[10px] text-[#A1887F] uppercase tracking-[0.2em] font-bold mt-1">Visitor Log System</p>
          </div>
        </div>
        {currentUser && (
          <div className="flex items-center gap-4">
            {location.pathname !== '/role-selection' && location.pathname !== '/login' && (
              <button 
                onClick={() => navigate('/role-selection')}
                className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all active:scale-90"
                title="Switch Role"
              >
                <Users size={20} />
              </button>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{currentUser.name}</p>
              <p className="text-[10px] text-white/60 font-medium">{currentUser.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-200 rounded-xl transition-all border border-white/10"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto p-6 min-h-[calc(100vh-80px)] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={
              currentUser ? <Navigate to="/role-selection" /> : (
                <motion.div 
                  key="login"
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -40, scale: 0.9 }}
                  transition={{ type: "spring", damping: 20, stiffness: 100 }}
                  className="max-w-md w-full mx-auto"
                >
                  <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-white/20 text-white">
                    <div className="text-center mb-10">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl p-2"
                      >
                        <img 
                          src={LOGO_URL} 
                          alt="NEU" 
                          className="w-full h-full object-contain" 
                          referrerPolicy="no-referrer" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-[#3E2723] font-black text-2xl">NEU</span>';
                          }}
                        />
                      </motion.div>
                      <h2 className="font-serif text-3xl font-black tracking-tight">New Era University Library</h2>
                      <p className="text-white/60 mt-2 font-medium">
                        Please sign in with your institutional email to continue
                      </p>
                    </div>

                    <div className="space-y-6">
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 text-red-200 bg-red-500/20 p-4 rounded-2xl text-sm border border-red-500/30"
                        >
                          <AlertCircle size={18} />
                          {error}
                        </motion.div>
                      )}

                      <button 
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full bg-white text-[#3E2723] py-5 rounded-2xl font-black text-lg hover:bg-white/90 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-xl"
                      >
                        <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
                        Continue with Google
                      </button>

                      <p className="text-[10px] text-white/30 text-center uppercase font-black tracking-[0.2em] leading-relaxed">
                        Access restricted to institutional <br /> @neu.edu.ph accounts only
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            } />

            <Route path="/role-selection" element={
              !currentUser ? <Navigate to="/login" /> : (
                <motion.div 
                  key="role-selection"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md w-full mx-auto"
                >
                  <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-white/20 text-white text-center">
                    <div className="w-20 h-20 bg-[#8D6E63] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl rotate-3">
                      <Library size={40} className="text-white" />
                    </div>
                    <h2 className="font-serif text-3xl font-black tracking-tight mb-2">Select Your Role</h2>
                    <p className="text-white/60 mb-10 font-medium">Choose your dashboard to continue</p>

                    <div className="space-y-4">
                      {[
                        { id: 'student', label: 'Student', icon: GraduationCap, color: 'bg-blue-500/20' },
                        { id: 'faculty', label: 'Faculty', icon: BookOpen, color: 'bg-emerald-500/20', restricted: true },
                        { id: 'admin', label: 'Admin', icon: Shield, color: 'bg-amber-500/20', restricted: true }
                      ].filter(role => !role.restricted || (currentUser?.email === 'eunice.mabasa@neu.edu.ph' || currentUser?.email === 'jcesperanza@neu.edu.ph')).map((role) => (
                        <button
                          key={role.id}
                          onClick={() => handleRoleSelect(role.id as any)}
                          className="w-full group relative flex items-center gap-5 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all active:scale-[0.98]"
                        >
                          <div className={`p-4 rounded-xl ${role.color} text-white group-hover:scale-110 transition-transform`}>
                            <role.icon size={24} />
                          </div>
                          <div className="text-left">
                            <p className="font-serif text-xl font-black tracking-tight">{role.label}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Enter Dashboard</p>
                          </div>
                          <ChevronRight size={20} className="ml-auto text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-8 flex items-center gap-3 text-red-200 bg-red-500/20 p-4 rounded-2xl text-xs border border-red-500/30 text-left"
                      >
                        <AlertCircle size={16} className="shrink-0" />
                        {error}
                      </motion.div>
                    )}

                    <button 
                      onClick={handleLogout}
                      className="mt-10 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )
            } />

            <Route path="/student-dashboard" element={
              <DashboardWrapper 
                currentUser={currentUser}
                userType={userType}
                setUserType={setUserType}
                collegeOffice={collegeOffice}
                setCollegeOffice={setCollegeOffice}
                handleProfileSetup={handleProfileSetup}
                handleLogVisit={handleLogVisit}
                reason={reason}
                setReason={setReason}
                navigate={navigate}
              />
            } />
            <Route path="/faculty-dashboard" element={
              (!currentUser || (currentUser.role !== 'admin' && currentUser.email !== 'eunice.mabasa@neu.edu.ph' && currentUser.email !== 'jcesperanza@neu.edu.ph')) ? <Navigate to="/role-selection" /> : (
                <DashboardWrapper 
                  currentUser={currentUser}
                  userType={userType}
                  setUserType={setUserType}
                  collegeOffice={collegeOffice}
                  setCollegeOffice={setCollegeOffice}
                  handleProfileSetup={handleProfileSetup}
                  handleLogVisit={handleLogVisit}
                  reason={reason}
                  setReason={setReason}
                  navigate={navigate}
                />
              )
            } />
            
            <Route path="/admin-dashboard" element={
              (!currentUser || (currentUser.role !== 'admin' && currentUser.email !== 'eunice.mabasa@neu.edu.ph' && currentUser.email !== 'jcesperanza@neu.edu.ph')) ? <Navigate to="/role-selection" /> : (
                <motion.div 
                  key="admin"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8 w-full"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Visitors', value: stats?.totalVisitsToday, icon: Users, color: 'blue' },
                      { label: 'Students', value: stats?.studentVisits, icon: GraduationCap, color: 'purple' },
                      { label: 'Faculty', value: stats?.facultyVisits, icon: BookOpen, color: 'orange' },
                      { label: 'Admin', value: stats?.adminVisits, icon: Shield, color: 'emerald' }
                    ].map((stat, i) => (
                      <motion.div 
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-xl text-white"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="p-4 bg-white/10 rounded-2xl"><stat.icon size={28} /></div>
                          {stat.label === 'Total Visitors' && (
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-full">Today</span>
                          )}
                        </div>
                        <p className="font-serif text-5xl font-black tracking-tighter mb-1">{stat.value || 0}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/50">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Controls */}
                  <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-xl flex flex-wrap gap-6 items-end text-white">
                    <div className="flex-1 min-w-[300px] space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Search User</label>
                      <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                        <input 
                          type="text" 
                          placeholder="Search by name or email..."
                          value={adminSearch}
                          onChange={(e) => setAdminSearch(e.target.value)}
                          className="w-full pl-14 pr-6 py-4 bg-white/5 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-white/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Date Range</label>
                      <div className="flex gap-3">
                        <input 
                          type="date" 
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="px-5 py-4 bg-white/5 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-white"
                        />
                        <input 
                          type="date" 
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="px-5 py-4 bg-white/5 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          const now = new Date();
                          const todayStr = now.toISOString().split('T')[0];
                          setDateRange({ start: todayStr, end: todayStr });
                        }}
                        className="px-6 py-4 bg-[#8D6E63] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#A1887F] transition-all shadow-lg"
                      >
                        Today
                      </button>
                      <button 
                        onClick={() => {
                          const now = new Date();
                          const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                          setDateRange({ start: lastWeek.toISOString().split('T')[0], end: now.toISOString().split('T')[0] });
                        }}
                        className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        Weekly
                      </button>
                      <button 
                        onClick={() => {
                          const now = new Date();
                          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                          setDateRange({ start: lastMonth.toISOString().split('T')[0], end: now.toISOString().split('T')[0] });
                        }}
                        className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        Monthly
                      </button>
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Visits */}
                    <div className="lg:col-span-2 space-y-6">
                      <h3 className="font-serif text-2xl font-black text-white flex items-center gap-3">
                        <BarChart3 size={24} className="text-[#A1887F]" />
                        Visitor Logs
                      </h3>
                      <div className="space-y-4">
                        {visits.filter(v => 
                          v.user_name?.toLowerCase().includes(adminSearch.toLowerCase()) || 
                          v.user_email?.toLowerCase().includes(adminSearch.toLowerCase())
                        ).map((visit, i) => (
                          <motion.div 
                            key={visit.id} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-xl flex justify-between items-center group hover:bg-white/10 transition-all text-white"
                          >
                            <div className="flex gap-5 items-center">
                              <div className="w-14 h-14 bg-[#8D6E63]/20 rounded-2xl flex items-center justify-center text-[#D7CCC8]">
                                {visit.user_type === 'student' ? <GraduationCap size={28} /> : visit.user_type === 'faculty' ? <BookOpen size={28} /> : <Shield size={28} />}
                              </div>
                              <div>
                                <p className="font-serif text-lg font-black tracking-tight">{visit.user_name}</p>
                                <p className="text-xs text-white/40 font-medium">{visit.user_email} • {visit.college_office}</p>
                                <div className="mt-2">
                                  <span className="text-[9px] uppercase font-black tracking-[0.15em] bg-[#8D6E63]/20 text-[#D7CCC8] px-3 py-1 rounded-full border border-[#8D6E63]/30">
                                    {visit.reason}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-serif text-sm font-black">{new Date(visit.timestamp).toLocaleDateString()}</p>
                              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* User Access Control */}
                    <div className="space-y-6">
                      <h3 className="font-serif text-2xl font-black text-white flex items-center gap-3">
                        <Shield size={24} className="text-[#A1887F]" />
                        Access Control
                      </h3>
                      <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-xl overflow-hidden">
                        <div className="divide-y divide-white/5">
                          {allUsers.filter(u => 
                            (u.name?.toLowerCase().includes(adminSearch.toLowerCase()) || 
                             u.email?.toLowerCase().includes(adminSearch.toLowerCase()))
                          ).map((user) => (
                            <div key={user.uid} className="p-6 flex flex-col gap-4 hover:bg-white/5 transition-all group">
                              <div className="flex justify-between items-center">
                                <div className="min-w-0">
                                  <p className="font-serif font-black tracking-tight text-white group-hover:text-[#D7CCC8] transition-colors truncate">{user.name}</p>
                                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest truncate">{user.email}</p>
                                </div>
                                <div className="flex gap-2">
                                  {user.email !== 'eunice.mabasa@neu.edu.ph' && user.email !== 'jcesperanza@neu.edu.ph' && (
                                    <button
                                      onClick={() => handleBlockUser(user.uid, !user.is_blocked)}
                                      className={`p-3 rounded-2xl transition-all active:scale-90 ${
                                        user.is_blocked 
                                          ? 'bg-red-500/20 text-red-200 border border-red-500/30' 
                                          : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                                      }`}
                                      title={user.is_blocked ? 'Unblock User' : 'Block User'}
                                    >
                                      {user.is_blocked ? <Unlock size={20} /> : <Ban size={20} />}
                                    </button>
                                  )}
                                  <select
                                    value={user.role}
                                    onChange={(e) => handleChangeRole(user.uid, e.target.value as any)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
                                  >
                                    <option value="user" className="bg-[#3E2723]">User</option>
                                    <option value="admin" className="bg-[#3E2723]">Admin</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            } />

            <Route path="/welcome" element={
              <motion.div 
                key="welcome"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl w-full mx-auto text-center"
              >
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                  className="w-32 h-32 bg-white text-[#8D6E63] rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl"
                >
                  <CheckCircle2 size={64} />
                </motion.div>
                <h1 className="font-serif text-6xl font-black text-white mb-6 drop-shadow-2xl">Welcome to NEU Library!</h1>
                <p className="text-2xl text-white/80 font-medium">
                  Your entry has been successfully recorded.
                  <br />
                  <span className="text-lg text-[#A1887F] mt-4 block">
                    This is your visit number <span className="text-white font-black">{(currentUser?.visitCount || 0) + 1}</span>
                  </span>
                </p>
                <div className="mt-12 flex flex-col items-center gap-6">
                  <button 
                    onClick={() => navigate('/role-selection')}
                    className="bg-white text-[#8D6E63] px-10 py-4 rounded-2xl font-black text-lg hover:bg-[#D7CCC8] transition-all shadow-xl active:scale-95"
                  >
                    Log Another Visit
                  </button>
                  <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                      <motion.div 
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-3 h-3 bg-white rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            } />

            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 py-10 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
          New Era University • Library Services • 2026
        </p>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
