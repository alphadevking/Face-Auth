import { Layout } from 'antd';
const { Header, Content, Footer } = Layout;
import { UserOutlined, MacCommandFilled } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Space } from 'antd';
import { useAuth } from '../utils/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { navMap } from './maps';

const Dashboard = () => {

    const { user } = useAuth();

    const items: MenuProps['items'] = navMap();

    const menuProps = {
        items,
    };


    return (
        <Layout className="min-h-screen">
            <Header className="grid justify-between grid-flow-col bg-white">
                <Link to='/' className='flex items-center gap-2 w-fit'>
                    <MacCommandFilled className='text-2xl text-blue-900' />
                    <div className='text-lg font-bold text-transparent bg-gradient-to-br from-slate-500 to-slate-800 bg-clip-text'>Authr University</div>
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
            <Footer className="p-4 text-center">
                <p>Authr ©{new Date().getFullYear()} Created by AlphaDevSys</p>
            </Footer>
        </Layout>
    );
};

export default Dashboard;
