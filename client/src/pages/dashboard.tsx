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

    // console.log(user)

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
                        Hello, {user?.firstname.toLocaleUpperCase()}
                    </Dropdown.Button>
                </Space>
            </Header>
            <Content className="p-6 grid gap-3">
                <p className="flex w-fit items-center gap-2">
                    <div className="font-semibold">
                        Student ID:
                    </div>
                    <span>
                        {user?.student_id}
                    </span>
                </p>
                <p className="flex w-fit items-center gap-2">
                    <div className="font-semibold">
                        Name:
                    </div>
                    <span>
                        {user?.firstname} {user?.middlename} {user?.lastname}
                    </span>
                </p>
                <p className="flex w-fit items-center gap-2">
                    <div className="font-semibold">
                        Date of Birth:
                    </div>
                    <span>
                        {user?.date_of_birth.toString()}
                    </span>
                </p>
                <p className="flex w-fit items-center gap-2">
                    <div className="font-semibold">
                        Email:
                    </div>
                    <span>
                        {user?.email}
                    </span>
                </p>
                <p className="flex w-fit items-center gap-2">
                    <div className="font-semibold">
                        Phone Number:
                    </div>
                    <span>
                        {user?.phone_number}
                    </span>
                </p>
                <p className="flex w-fit items-center gap-2">
                    <div className="font-semibold">
                        Faculty:
                    </div>
                    <span>
                        {user?.faculty}
                    </span>
                </p>
                <p className="flex w-fit items-center gap-2">
                    <div className="font-semibold">
                        Department:
                    </div>
                    <span>
                        {user?.department}
                    </span>
                </p>
                <p className="flex w-fit items-center gap-2">
                    <div className="font-semibold">
                        Level:
                    </div>
                    <span>
                        {user?.level}
                    </span>
                </p>
                <p className="flex w-fit items-center gap-2">
                    <div className="font-semibold">
                        Academic Session:
                    </div>
                    <span>
                        {user?.academic_session}
                    </span>
                </p>
            </Content>
            <Footer className="p-4 text-center">
                {/* <p>Authr ©{new Date().getFullYear()} Created by AlphaDevSys</p> */}
            </Footer>
        </Layout>
    );
};

export default Dashboard;
