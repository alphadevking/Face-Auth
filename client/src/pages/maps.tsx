import { MenuProps } from "antd"
import { /* LoginOutlined,  */LogoutOutlined } from '@ant-design/icons';
import { useAuth } from "../utils/contexts/AuthContext";
// import { useNavigate } from "react-router-dom";
import AAU_Faculties_and_Departments from '../utils/json/AAU_Faculties_and_Departments.json'

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

export const aau_faculties = AAU_Faculties_and_Departments.Faculties;
