import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings,
  LogOut,
  LogIn,
  Stethoscope,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { appointmentService } from './services/appointmentService';
import { Appointment, ClinicInfo } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
  const [isEditingClinic, setIsEditingClinic] = useState(false);
  const [editClinicData, setEditClinicData] = useState<Partial<ClinicInfo>>({});
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'receptionist' | 'admin'>('receptionist');

  useEffect(() => {
    appointmentService.testConnection();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAdmin(user?.email === 'emondsabiniano@gmail.com');
    });

    const unsubscribeClinic = appointmentService.subscribeToClinicInfo(setClinicInfo);

    return () => {
      unsubscribeAuth();
      unsubscribeClinic();
    };
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const unsubscribe = appointmentService.subscribeToAppointments(setAppointments);
      return () => unsubscribe();
    }
  }, [isAdmin]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError('Failed to sign in');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
  };

  const handleSaveClinicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await appointmentService.updateClinicInfo(clinicInfo?.id, editClinicData);
      setIsEditingClinic(false);
    } catch (err) {
      setError('Failed to update clinic information');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-black/5 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
            <Stethoscope size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{clinicInfo?.name || 'Healthy Life'}</h1>
            <p className="text-xs text-black/50 uppercase tracking-wider font-semibold">Medical Center</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAdmin && (
            <div className="flex bg-[#F0F0F0] p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('receptionist')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === 'receptionist' ? "bg-white shadow-sm text-emerald-600" : "text-black/60 hover:text-black"
                )}
              >
                Receptionist
              </button>
              <button 
                onClick={() => setActiveTab('admin')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === 'admin' ? "bg-white shadow-sm text-emerald-600" : "text-black/60 hover:text-black"
                )}
              >
                Admin Dashboard
              </button>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-black/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user.displayName}</p>
                <p className="text-xs text-black/50">{isAdmin ? 'Administrator' : 'Patient'}</p>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-black/80 transition-all"
            >
              <LogIn size={18} />
              Staff Login
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'receptionist' ? (
            <motion.div 
              key="receptionist"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-2 gap-12 items-center py-12"
            >
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-6xl font-bold tracking-tight leading-[1.1]">
                    Your AI <span className="text-emerald-600">Health</span> Concierge.
                  </h2>
                  <p className="text-xl text-black/60 max-w-lg leading-relaxed">
                    Book appointments, check availability, and get clinic information instantly using just your voice.
                  </p>
                </div>

                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-black/40 font-bold uppercase">Hours</p>
                        <p className="text-sm font-medium">{clinicInfo?.hours || '8:00 AM - 6:00 PM'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                      <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-black/40 font-bold uppercase">Location</p>
                        <p className="text-sm font-medium">{clinicInfo?.address || 'Wellness City, 123 Health St'}</p>
                      </div>
                    </div>
                    {clinicInfo?.phone && (
                      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                          <Phone size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-black/40 font-bold uppercase">Phone</p>
                          <p className="text-sm font-medium">{clinicInfo.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
              </div>

              <div className="flex justify-center">
                <div className="w-full max-w-2xl bg-white rounded-[32px] shadow-xl overflow-hidden border border-black/5">
                  <iframe 
                    src="https://bey.chat/agent/71b425b4-f35b-4462-8bb8-4978cb41eeeb" 
                    width="100%" 
                    height="600px" 
                    frameBorder="0" 
                    allowFullScreen
                    allow="camera *; microphone *; clipboard-write; autoplay; fullscreen; display-capture; geolocation"
                    style={{ border: 'none', maxWidth: '100%' }}
                  ></iframe>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 py-6"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold">Appointments</h2>
                  <p className="text-black/50">Manage scheduled patient visits</p>
                </div>
                <div className="flex gap-4 items-center">
                  <button 
                    onClick={() => {
                      setEditClinicData(clinicInfo || {});
                      setIsEditingClinic(true);
                    }}
                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-black/5 hover:bg-black/[0.02] transition-all text-sm font-medium"
                  >
                    <Settings size={18} className="text-black/40" />
                    Clinic Settings
                  </button>
                  <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-black/5 text-center">
                    <p className="text-[10px] font-bold text-black/40 uppercase">Total</p>
                    <p className="text-xl font-bold">{appointments.length}</p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-black/5 text-center">
                    <p className="text-[10px] font-bold text-black/40 uppercase">Pending</p>
                    <p className="text-xl font-bold text-orange-600">
                      {appointments.filter(a => a.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[32px] shadow-sm border border-black/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/5 bg-black/[0.02]">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Patient</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Date & Time</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Reason</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Status</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-black/40">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {appointments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-black/40 italic">
                            No appointments found.
                          </td>
                        </tr>
                      ) : (
                        appointments.map((apt) => (
                          <tr key={apt.id} className="hover:bg-black/[0.01] transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                                  {apt.patientName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold">{apt.patientName}</p>
                                  <p className="text-xs text-black/50">{apt.patientPhone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar size={14} className="text-black/40" />
                                  {apt.date}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock size={14} className="text-black/40" />
                                  {apt.time}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-black/70 max-w-xs truncate">{apt.reason || 'General checkup'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                apt.status === 'confirmed' && "bg-emerald-100 text-emerald-700",
                                apt.status === 'pending' && "bg-orange-100 text-orange-700",
                                apt.status === 'cancelled' && "bg-red-100 text-red-700"
                              )}>
                                {apt.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {apt.status === 'pending' && (
                                  <button 
                                    onClick={() => appointmentService.updateAppointmentStatus(apt.id!, 'confirmed')}
                                    className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                                    title="Confirm"
                                  >
                                    <CheckCircle size={18} />
                                  </button>
                                )}
                                {apt.status !== 'cancelled' && (
                                  <button 
                                    onClick={() => appointmentService.updateAppointmentStatus(apt.id!, 'cancelled')}
                                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                    title="Cancel"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Clinic Info Modal */}
      <AnimatePresence>
        {isEditingClinic && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 border-b border-black/5 flex justify-between items-center">
                <h3 className="text-2xl font-bold">Clinic Settings</h3>
                <button onClick={() => setIsEditingClinic(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <XCircle size={24} className="text-black/40" />
                </button>
              </div>
              <form onSubmit={handleSaveClinicInfo} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40 block mb-2">Clinic Name</label>
                    <input 
                      type="text"
                      value={editClinicData.name || ''}
                      onChange={e => setEditClinicData({...editClinicData, name: e.target.value})}
                      className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Healthy Life Medical Center"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40 block mb-2">Address</label>
                    <input 
                      type="text"
                      value={editClinicData.address || ''}
                      onChange={e => setEditClinicData({...editClinicData, address: e.target.value})}
                      className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="123 Health St, Wellness City"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40 block mb-2">Phone</label>
                    <input 
                      type="text"
                      value={editClinicData.phone || ''}
                      onChange={e => setEditClinicData({...editClinicData, phone: e.target.value})}
                      className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40 block mb-2">Hours</label>
                    <input 
                      type="text"
                      value={editClinicData.hours || ''}
                      onChange={e => setEditClinicData({...editClinicData, hours: e.target.value})}
                      className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Mon-Fri 8am-6pm, Sat 9am-2pm"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditingClinic(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-black/10 font-bold hover:bg-black/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto p-12 border-t border-black/5 mt-12">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                <Stethoscope size={18} />
              </div>
              <h3 className="font-bold">Healthy Life</h3>
            </div>
            <p className="text-sm text-black/50 leading-relaxed">
              Providing compassionate, high-quality healthcare to our community for over 15 years.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-black/40">Quick Links</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Our Doctors</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Services</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Patient Portal</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-black/40">Contact</h4>
            <ul className="space-y-2 text-sm text-black/60">
              <li className="flex items-center gap-2"><Phone size={14} /> (555) 123-4567</li>
              <li className="flex items-center gap-2"><MapPin size={14} /> 123 Health St, Wellness City</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-black/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-black/40">© 2026 Healthy Life Medical Center. All rights reserved.</p>
          <div className="flex gap-6 text-xs font-bold text-black/40 uppercase tracking-widest">
            <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-black transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
