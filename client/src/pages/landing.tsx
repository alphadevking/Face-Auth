import { Layout, Carousel, Button, Card, Space, Dropdown, MenuProps } from 'antd';
const { Header, Content, Footer } = Layout;
import { UserOutlined, MacCommandFilled } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/contexts/AuthContext';
import { navMap } from './maps';

const Landing = () => {

    const { user } = useAuth();

    const navigate = useNavigate();

    const items: MenuProps['items'] = navMap();

    const menuProps = {
        items,
    };

    return (
        <Layout className="flex flex-col min-h-screen">
            <Header className="flex items-center justify-between px-5 py-3 border-b bg-slate-50">
                <Link to='/' className='flex items-center gap-2 w-fit'>
                    <MacCommandFilled className='text-2xl text-blue-900' />
                    <div className='text-lg font-bold text-transparent bg-gradient-to-br from-slate-500 to-slate-800 bg-clip-text'>Authr University</div>
                </Link>
                {
                    user ? (
                        <Space wrap>
                            <Dropdown.Button onClick={() => navigate('/dashboard')} loading={!user} menu={menuProps} placement="bottom" icon={<UserOutlined />}>
                                Hello, {user?.fullname.toLocaleUpperCase()}
                            </Dropdown.Button>
                        </Space>
                    ) : (
                        <Space wrap>
                            <Link to={'/login'} >
                                <Button icon={<UserOutlined />}>
                                    Login
                                </Button>
                            </Link>
                        </Space>
                    )
                }
            </Header>
            <Content className="flex-grow p-6">
                <Carousel autoplay className="select-none" draggable>
                    <div className="bg-gray-100 lg:py-5 lg:flex lg:justify-center">
                        <div className="bg-white lg:mx-8 lg:flex lg:shadow-lg lg:rounded-lg">
                            <div className="lg:w-1/2">
                                <div
                                    className="bg-cover h-80 lg:rounded-lg lg:h-full"
                                    style={{
                                        backgroundImage:
                                            'url("https://img.freepik.com/premium-photo/communication-banks-through-correspondents-transactions-banks_1048944-28574876.jpg?w=740")'
                                    }}
                                />
                            </div>
                            <div className="max-w-xl px-6 py-12 lg:max-w-5xl lg:w-1/2">
                                <h2 className="text-3xl font-bold text-gray-800">
                                    <span className="font-extrabold text-transparent bg-gradient-to-r from-fuchsia-700 to-cyan-700 bg-clip-text">Seamless</span> Integration
                                </h2>
                                <p className="mt-4 text-gray-600">
                                    Integrate effortlessly with your existing systems, ensuring a smooth and unified experience for all users.
                                </p>
                                <div className="mt-8">
                                    <a
                                        href="/dashboard"
                                        className="px-5 py-3 font-semibold bg-gray-900 rounded text-fuchsia-50 hover:text-fuchsia-300"
                                    >
                                        Explore
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-100 lg:py-5 lg:flex lg:justify-center">
                        <div className="bg-white lg:mx-8 lg:flex lg:shadow-lg lg:rounded-lg">
                            <div className="lg:w-1/2">
                                <div
                                    className="bg-cover h-80 lg:rounded-lg lg:h-full"
                                    style={{
                                        backgroundImage:
                                            'url("https://img.freepik.com/free-photo/facial-recognition-software_52683-104208.jpg?w=900")'
                                    }}
                                />
                            </div>
                            <div className="px-6 py-12 lg:w-1/2">
                                <h2 className="text-3xl font-bold text-gray-800">
                                    <span className="font-extrabold text-transparent bg-gradient-to-r from-fuchsia-700 to-cyan-700 bg-clip-text">Facial</span> Authentication
                                </h2>
                                <p className="mt-4 text-gray-600">
                                    Enhance security with our state-of-the-art facial authentication system, providing a safe and reliable method for user verification.
                                </p>
                                <div className="mt-8">
                                    <a
                                        href="/dashboard"
                                        className="px-5 py-3 font-semibold rounded bg-gradient-to-r from-fuchsia-700 to-cyan-700 text-fuchsia-50 hover:text-fuchsia-100"
                                    >
                                        Start Now
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </Carousel>
                <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2">
                    <Card className="transition-shadow duration-300 hover:shadow-lg" hoverable>
                        <h4 className="text-xl font-bold">Real-Time Data Management</h4>
                        <p>Manage student records, attendance, grades, and more in real time, ensuring accurate and up-to-date information.</p>
                    </Card>
                    <Card className="transition-shadow duration-300 hover:shadow-lg" hoverable>
                        <h4 className="text-xl font-bold">Collaborative Tools</h4>
                        <p>Our integrated communication tools foster collaboration among students and faculty, enhancing the learning experience.</p>
                    </Card>
                </div>
                <div className="mt-6 text-center">
                    <Link to="/face-verify" className="px-4 py-3 mt-4 font-bold duration-500 bg-gradient-to-br from-fuchsia-700 to-cyan-700 hover:opacity-75 text-slate-50 hover:text-slate-50 rounded-xl">
                        Get Started
                    </Link>
                </div>
            </Content>
            <Footer className="p-4 text-center">
                <p>Authr ©{new Date().getFullYear()} Created by AlphaDevSys</p>
            </Footer>
        </Layout>
    );
};

export default Landing;
