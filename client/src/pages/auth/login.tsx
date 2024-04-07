import React, { useCallback, /* useContext, */ useRef, useState } from 'react';
import { Button, Divider, Form, Input, Modal, Space } from 'antd';
import Webcam from 'react-webcam';
import axios from 'axios';
import { useAuth } from '../../utils/contexts/AuthContext';
import { MacCommandFilled } from '@ant-design/icons';
import { Content } from 'antd/es/layout/layout';
import { Link } from 'react-router-dom';

const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
};

interface LoginValues {
    username: string;
    // Include other fields if necessary
}

const Login: React.FC = () => {
    const webcamRef = useRef<Webcam>(null);
    const [image, setImage] = useState<string>('');
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [isPermissionModalVisible, setIsPermissionModalVisible] = useState<boolean>(false);
    const [isAlertModalVisible, setIsAlertModalVisible] = useState<boolean>(false);
    const [alertModalContent, setAlertModalContent] = useState({ title: '', message: '' });
    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const [form] = Form.useForm<LoginValues>();
    const [webcamKey, setWebcamKey] = useState<number>(0);

    const { fetchUser } = useAuth();

    const handleCancel = () => {
        stopWebcam();
        setIsModalVisible(false);
        setImage(''); // Clear the captured image when the modal is closed
    };

    // console.log(image);

    const handleFaceVerification = (): void => {
        // Show the permission modal first
        setIsPermissionModalVisible(true);
    };

    const handlePermissionGranted = (): void => {
        setIsPermissionModalVisible(false);
        setIsModalVisible(true);
        setWebcamKey(prevKey => prevKey + 1); // Increment key to force reinitialization
    };

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setImage(imageSrc);
                stopWebcam();
                setIsModalVisible(false); // Close the modal after capture
            }
        }
    }, [webcamRef]);

    const stopWebcam = (): void => {
        if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.srcObject) {
            const stream = webcamRef.current.video.srcObject as MediaStream;  // Type assertion here
            const tracks = stream.getTracks();

            tracks.forEach((track) => {
                track.stop();
            });

            setIsModalVisible(false);
        }
    };

    const handleLogin = async (values: LoginValues) => {
        setSubmitLoading(true)
        if (!image) {
            alert('Please capture your image first.');
            setSubmitLoading(false);
            return;
        }

        try {
            await axios.post('http://localhost:8000/face-auth', {
                username: values.username,
                face_encoding: image,
            }, {
                withCredentials: true
            }).then(async res => {
                // Handle successful login
                // console.info(res.data.message);
                fetchUser()
                // form.resetFields();
                // setImage('');
                setAlertModalContent({ title: 'Success', message: res.data.message });
                setIsAlertModalVisible(true);
            }).catch(error => {
                // Handle login error
                console.error(error.response?.data?.detail || 'An error occurred during login.'); setAlertModalContent({ title: 'Error', message: error.response.data.detail });
                setIsAlertModalVisible(true);
            }).finally(() => {
                setSubmitLoading(false);
            });
        } catch (error) {
            console.log(error)
        }
    };

    return (
        <>
            <Content className='p-5 min-h-screen m-auto grid max-w-xl items-center'>
                <div className='grid gap-2'>
                    
                    <Link to='/' className='grid gap-2 justify-center items-center'>
                        <MacCommandFilled className='text-5xl text-blue-900 mx-auto' />
                        <div className='text-2xl font-bold bg-gradient-to-br from-slate-500 to-slate-800 bg-clip-text text-transparent'>Authr University</div>
                    </Link>

                    <div className='grid gap-3 border p-5 rounded-xl'>

                        <div className='text-cyan-600 font-semibold text-lg'>
                            Login
                        </div>

                        <Divider className='my-3' />

                        {
                            image ? (
                                <Space direction='vertical' size={'small'}>
                                    <img src={image} alt="Captured" className='w-1/2 rounded' />
                                    <Button type='dashed' className='bg-red-500 text-emerald-50' size='middle' onClick={() => (
                                        setImage('')
                                    )}>Reset</Button>
                                </Space>
                            ) : (
                                <Button type="default"
                                    onClick={handleFaceVerification}
                                    loading={isPermissionModalVisible || isModalVisible}
                                >
                                    Open Webcam
                                </Button>
                            )
                        }
                        <Form
                            form={form}
                            onFinish={handleLogin}
                            layout="vertical"
                            name="loginForm"
                            className='grid gap-2'
                        >
                            <Form.Item label='Username' name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
                                <Input placeholder="Username" />
                            </Form.Item>
                            <Button type="default" htmlType="submit" loading={submitLoading}>Login</Button>
                        </Form>
                    </div>

                </div>

                {/* Permission Modal */}
                <Modal
                    title="Permission Request"
                    open={isPermissionModalVisible}
                    onOk={handlePermissionGranted}
                    onCancel={() => setIsPermissionModalVisible(false)}
                >
                    <p>Please, we need access to your webcam for face verification. Do you agree?</p>
                </Modal>

                {/* Webcam Modal */}
                <Modal
                    title="Capture Your Face"
                    open={isModalVisible}
                    onCancel={handleCancel}
                    footer={[
                        <Button key="capture" onClick={capture}>Capture</Button>,
                        <Button key="reset" onClick={() => (
                            setImage('')
                        )}>Reset</Button>
                    ]}
                >
                    <Webcam
                        key={webcamKey}
                        audio={false}
                        height={720}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width={1280}
                        videoConstraints={videoConstraints}
                        mirrored
                    />
                </Modal>

                {/* Alert Modal */}
                <Modal
                    title={alertModalContent.title}
                    open={isAlertModalVisible}
                    onCancel={() => setIsAlertModalVisible(false)}
                    footer={[
                        alertModalContent.title === 'Success' && (
                            <Button key="login" type="default" onClick={() => window.location.href = '/dashboard'}>
                                Dashboard
                            </Button>
                        ),
                    ]}
                >
                    <p>{alertModalContent.message}</p>
                </Modal>
            </Content>
        </>
    );

};

export default Login;
