import { Divider, Layout } from 'antd';
const { Header } = Layout;
import { UserOutlined, MacCommandFilled } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Space } from 'antd';
import { useAuth } from '../utils/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { navMap } from './maps';
import { useEffect, useState } from 'react';

const Dashboard = () => {

    const { user } = useAuth();

    // console.log(user)

    const [passportUrl, setPassportUrl] = useState<string>('');

    useEffect(() => {
        const images = import.meta.glob('/src/assets/user/**/passport.jpg');

        const filePath = `/src/assets/user/${user?.student_id.toUpperCase()}/passport.jpg`;

        if (images[filePath]) {
            images[filePath]().then((module: any) => {
                setPassportUrl(module.default);
            });
        } else {
            console.warn('Passport image not found');
        }
    }, [user?.student_id]);

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

            <div className='rounded-full rounded-t-3xl mx-2 bg-gradient-to-r from-neutral-300 to-stone-400 p-10 pt-6 mb-44'>
                <div className="mt-6 md:mt-20 -mb-40 p-6 rounded-3xl mx-auto grid gap-2 md:gap-5 md:grid-flow-col items-center w-full max-w-3xl h-full bg-white text-slate-900 shadow">
                    <div className='grid justify-center'>
                        <img src={passportUrl} alt="Student Passport" className="rounded-[2rem] my-1 m-auto justify-self-center pointer-events-none select-none" />
                    </div>

                    <div className="px-2 grid gap-2">
                        <div className="text-xl uppercase font-bold white text-start">
                            {user?.firstname} {user?.middlename} {user?.lastname}
                        </div>

                        <Divider className='my-2'/>

                        <p className="flex items-center gap-2">
                            <strong>Student ID:</strong>
                            <span>{user?.student_id}</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <strong>Date of Birth:</strong>
                            <span>{user?.date_of_birth.toString()}</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <strong>Email:</strong>
                            <span>{user?.email}</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <strong>Phone Number:</strong>
                            <span>{user?.phone_number}</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <strong>Faculty:</strong>
                            <span>{user?.faculty}</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <strong>Department:</strong>
                            <span>{user?.department}</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <strong>Level:</strong>
                            <span>{user?.level}</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <strong>Academic Session:</strong>
                            <span>{user?.academic_session}</span>
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
