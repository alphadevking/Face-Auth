import { MenuProps } from "antd"
import { /* LoginOutlined,  */LogoutOutlined } from '@ant-design/icons';
import { useAuth } from "../utils/contexts/AuthContext";
// import { useNavigate } from "react-router-dom";

export const navMap = () => {
    const { logout } = useAuth();

    // const navigate = useNavigate();
    
    const items: MenuProps['items'] = [
        // {
        //     label: 'Dashboard',
        //     key: '1',
        //     icon: <LoginOutlined />,
        //     // danger: true,
        //     onClick: () => navigate('/dashboard')
        // },
        {
            label: 'Logout',
            key: '2',
            icon: <LogoutOutlined />,
            danger: true,
            onClick: logout
        }
    ];
    return items;
}
