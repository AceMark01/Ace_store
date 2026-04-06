import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mail, Phone, User, Save, X, Trash2, Upload, Loader2, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadAvatar, saveAvatarUrl } from '../utils/avatarService';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [settingsModal, setSettingsModal] = useState(null);
    const [settingsValue, setSettingsValue] = useState("");
    const [address, setAddress] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [editAddress, setEditAddress] = useState(false);
    const [activeTab, setActiveTab] = useState("info");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        fullName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const [addressFields, setAddressFields] = useState({
        address_line1: "",
        address_line2: "",
        landmark: "",
        city: "",
        state: "",
        country: "India",
        postal_code: "",
        address_type: "home"
    });

    useEffect(() => {
        if (!user) return;
        const addresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
        const userAddr = addresses.find(a => a.user_id === user.id && a.is_default);
        if (userAddr) {
            setAddress(userAddr);
            setAddressFields(userAddr);
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateSetting = async () => {
        if (!settingsModal || !user?.id) return;
        try {
            const users = JSON.parse(localStorage.getItem('ace_store_users') || '[]');
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                if (settingsModal === "phone") users[userIndex].phone = settingsValue;
                if (settingsModal === "email") users[userIndex].email = settingsValue;
                if (settingsModal === "password") users[userIndex].password = newPassword;
                localStorage.setItem('ace_store_users', JSON.stringify(users));
                updateUser({ [settingsModal]: settingsValue });
            }
            alert("Updated successfully!");
            setSettingsModal(null);
        } catch (err) {
            console.error(err);
            alert("Update failed");
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file && user?.id) {
            setIsUploading(true);
            try {
                const url = await uploadAvatar(file, user.id);
                if (url) {
                    await saveAvatarUrl(user.id, url);
                    updateUser({ avatar_url: url });
                    alert('Profile picture updated!');
                }
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleRemoveImage = async () => {
        if (user?.id) {
            setIsUploading(true);
            try {
                await saveAvatarUrl(user.id, null);
                updateUser({ avatar_url: null });
                alert('Profile picture removed!');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSaveAddress = () => {
        if (!user?.id) return;
        const addresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
        const otherAddresses = addresses.filter(a => a.user_id !== user.id);
        const newAddr = { ...addressFields, user_id: user.id, is_default: true, id: address?.id || Date.now() };
        localStorage.setItem('userAddresses', JSON.stringify([...otherAddresses, newAddr]));
        setAddress(newAddr);
        setEditAddress(false);
        alert('Address updated!');
    };

    const handleSaveChanges = () => {
        const users = JSON.parse(localStorage.getItem('ace_store_users') || '[]');
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex].name = formData.fullName;
            users[userIndex].email = formData.email;
            users[userIndex].phone = formData.phone;
            localStorage.setItem('ace_store_users', JSON.stringify(users));
            updateUser({ name: formData.fullName, email: formData.email, phone: formData.phone });
        }
        alert('Changes saved!');
        setIsEditing(false);
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-5xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-slate-50 shadow-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-5xl font-bold">
                                {isUploading ? <Loader2 className="animate-spin" size={48} /> : user?.avatar_url ? <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-full" onClick={() => !isUploading && fileInputRef.current?.click()}><Camera className="text-white" size={32} /></div>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                        </div>
                        <div className="mt-6"><h3 className="text-2xl font-bold text-slate-800">{user?.name}</h3><p className="text-slate-500 font-medium capitalize">{user?.role || 'User'}</p></div>
                        <div className="flex flex-col gap-3 mt-8 w-full">
                            <button onClick={() => fileInputRef.current?.click()} className="py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2">{isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />} {isUploading ? 'Uploading...' : 'Change Photo'}</button>
                            {user?.avatar_url && <button onClick={handleRemoveImage} className="py-2.5 text-rose-600 font-semibold hover:bg-rose-50 rounded-xl transition-all">Remove Photo</button>}
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-2/3 space-y-6">
                    <div className="flex bg-white rounded-2xl shadow-sm border border-slate-100 p-1">
                        {["info", "address", "settings"].map(t => (
                            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all capitalize ${activeTab === t ? "bg-red-600 text-white shadow-md shadow-red-200" : "text-slate-500 hover:bg-slate-50"}`}>{t}</button>
                        ))}
                    </div>

                    {activeTab === "info" && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
                            <div className="flex items-center justify-between"><h3 className="text-xl font-bold text-slate-800">Profile Information</h3>{!isEditing && <button onClick={() => setIsEditing(true)} className="text-red-600 font-bold text-sm">Edit Profile</button>}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label><input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} disabled={!isEditing} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-red-500/20 disabled:opacity-75" /></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!isEditing} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-red-500/20 disabled:opacity-75" /></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</label><input type="text" name="phone" value={formData.phone} onChange={handleInputChange} disabled={!isEditing} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-red-500/20 disabled:opacity-75" /></div>
                            </div>
                            {isEditing && <div className="flex gap-4 pt-2"><button onClick={handleSaveChanges} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">Save Changes</button><button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button></div>}
                        </div>
                    )}

                    {activeTab === "address" && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
                            <div className="flex items-center justify-between"><div><h3 className="text-xl font-bold text-slate-800">Address</h3><p className="text-sm text-slate-500">Shipping details</p></div><button onClick={() => editAddress ? handleSaveAddress() : setEditAddress(true)} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm transition-all">{editAddress ? "Save" : "Change"}</button></div>
                            <div className="grid grid-cols-2 gap-4">
                                <input disabled={!editAddress} value={addressFields.address_line1} onChange={e => setAddressFields({ ...addressFields, address_line1: e.target.value })} placeholder="Address Line 1" className="col-span-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" />
                                <input disabled={!editAddress} value={addressFields.address_line2} onChange={e => setAddressFields({ ...addressFields, address_line2: e.target.value })} placeholder="Address Line 2" className="col-span-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" />
                                <input disabled={!editAddress} value={addressFields.city} onChange={e => setAddressFields({ ...addressFields, city: e.target.value })} placeholder="City" className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" />
                                <input disabled={!editAddress} value={addressFields.state} onChange={e => setAddressFields({ ...addressFields, state: e.target.value })} placeholder="State" className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" />
                            </div>
                        </div>
                    )}

                    {activeTab === "settings" && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Account Security</h3>
                            {["email", "phone", "password"].map(type => (
                                <button key={type} onClick={() => { setSettingsModal(type); setSettingsValue(user[type] || ""); }} className="w-full flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700 capitalize">Change {type} <Save size={16} className="text-slate-400" /></button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {settingsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-sm space-y-6 shadow-2xl animate-fade-in-up">
                        <h3 className="text-xl font-bold text-slate-800 capitalize">Change {settingsModal}</h3>
                        {settingsModal === "password" ? (
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" placeholder="New password" />
                        ) : (
                            <input value={settingsValue} onChange={e => setSettingsValue(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200" placeholder={`Enter new ${settingsModal}`} />
                        )}
                        <div className="flex gap-4 pt-2">
                            <button onClick={handleUpdateSetting} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200">Save</button>
                            <button onClick={() => setSettingsModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
