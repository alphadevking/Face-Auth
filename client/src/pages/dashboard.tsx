import { Layout } from 'antd';
const { Header, Content, Footer } = Layout;
import { UserOutlined, LogoutOutlined, MacCommandFilled } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Space } from 'antd';
import { useAuth } from '../utils/contexts/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {

    const { user, logout } = useAuth();

    const items: MenuProps['items'] = [
        {
            label: 'Logout',
            key: '1',
            icon: <LogoutOutlined />,
            danger: true,
            onClick: logout
        }
    ];

    const menuProps = {
        items,
    };


    return (
        <Layout className="min-h-screen">
            <Header className="bg-white grid grid-flow-col justify-between">
                <Link to='/' className='flex w-fit gap-2 items-center'>
                    <MacCommandFilled className='text-2xl text-blue-900' />
                    <div className='text-lg font-bold bg-gradient-to-br from-slate-500 to-slate-800 bg-clip-text text-transparent'>Authr University</div>
                </Link>
                <Space wrap>
                    <Dropdown.Button loading={!user} menu={menuProps} placement="bottom" icon={<UserOutlined />}>
                        Hello, {user?.fullname.toLocaleUpperCase()}
                    </Dropdown.Button>
                </Space>
            </Header>
            <Content className="p-6">
                <div>Dashboard</div>
            </Content>
            <Footer className="text-center p-4">
                <p>Authr ©{new Date().getFullYear()} Created by AlphaDevSys</p>
            </Footer>
        </Layout>
    );
};

export default Dashboard;
