import {Navigate,Outlet,useLocation} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
export default function ProtectedRoute(){const {user,loading}=useAuth(),location=useLocation();if(loading)return <div className="page-loading" role="status">Opening your stockroom…</div>;return user?<Outlet/>:<Navigate to="/login" state={{from:location.pathname}} replace/>}
