import { Button, /* Checkbox, */ Divider, Form, Input, Modal } from 'antd';
import { Content } from 'antd/es/layout/layout';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { MacCommandFilled } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const FaceVerify = () => {

    const [form] = Form.useForm();

    const [isPermissionModalVisible, setIsPermissionModalVisible] = useState<boolean>(false);
    const [isWebcamModalVisible, setIsWebcamModalVisible] = useState<boolean>(false);
    // State to manage webcam key for reinitialization
    const [webcamKey, setWebcamKey] = useState<number>(0);
    const [captureCount, setCaptureCount] = useState<number>(0);
    const webcamRef = useRef<Webcam>(null);
    const [screenshotArray, setScreenshotArray] = useState<string[]>([]);
    const [captureComplete, setCaptureComplete] = useState<boolean>(false);

    const handleFaceVerification = (): void => {
        // Show the permission modal first
        setIsPermissionModalVisible(true);
    };

    const handlePermissionGranted = (): void => {
        setIsPermissionModalVisible(false);
        setIsWebcamModalVisible(true);
        setWebcamKey(prevKey => prevKey + 1); // Increment key to force reinitialization
    };

    const capture = useCallback((): void => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setScreenshotArray(prevScreenshots => [
                    ...prevScreenshots,
                    imageSrc
                ]);
            } else {
                console.error('Failed to capture image');
            }

            // Send this imageSrc to your backend for verification

            setCaptureCount(prevCount => {
                if (prevCount >= 4) {
                    // If this is the 5th capture, close the modal
                    setIsWebcamModalVisible(false);
                    stopWebcam();
                    return 0; // Reset the count
                }
                return prevCount + 1; // Increment the count
            });

            if (captureCount === 4) {
                setCaptureComplete(true);
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

            setIsWebcamModalVisible(false);
            setCaptureCount(0);
        }
    };

    useEffect(() => {
        if (captureComplete) {
            setScreenshotArray([]);
        }
    }, [captureComplete]);

    // console.log(screenshotArray);

    const [isAlertModalVisible, setIsAlertModalVisible] = useState<boolean>(false);
    const [alertModalContent, setAlertModalContent] = useState({ title: '', message: '' });
    const [submitLoading, setSubmitLoading] = useState<boolean>(false);

    const handleFormSubmission = async () => {
        setSubmitLoading(true)
        try {
            const formValues = await form.validateFields();
            // console.log(formValues)
            console.log('Form is valid! Processing submission...');

            // Construct the payload
            const payload = {
                username: formValues.username,
                fullname: formValues.fullname,
                bio: formValues.bio,
                face_encodings: screenshotArray,
            };

            // Send the payload to your backend
            await axios.post('http://localhost:8000/face-register', payload).then(res => {
                console.log('Registration successful:', res);
                setAlertModalContent({ title: 'Success', message: res.data.message });
                setIsAlertModalVisible(true);

                // Reset the form and screenshot array after successful submission
                form.resetFields();
                setScreenshotArray([]);
                setCaptureComplete(false);
            }).catch(error => {
                console.log('Validation failed or submission error:', error.response.data.detail);
                // On error
                setAlertModalContent({ title: 'Error', message: error.response.data.detail });
                setIsAlertModalVisible(true);
            }).finally(() => {
                setSubmitLoading(false);
            });
        } catch (error) {
            console.log(error)
            const t = setTimeout(() => setSubmitLoading(false), 700)
            return () => clearTimeout(t);
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

                    <div className='grid gap-1 border p-5 rounded-xl'>
                        <div className='text-cyan-600 font-semibold text-lg'>
                            Register
                        </div>
                        <Divider className='my-3' />
                        <Form
                            form={form}
                            layout="vertical"
                            name="userForm"
                        >
                            <Form.Item label="Username" name="username" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item label="Full Name" name="fullname" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item label="Bio" name="bio" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                            {/* Add more fields as needed */}
                            {/* <Form.Item rules={[{ required: true }]}>
                            <Checkbox required title='' className='select-none'>
                                {"I agree to the Terms and Conditions of this website!"}
                            </Checkbox>
                        </Form.Item> */}
                            {
                                !isWebcamModalVisible && screenshotArray.length === 5 ? (
                                    <div className='grid gap-2'>
                                        <div className='grid grid-flow-col gap-2'>
                                            {
                                                screenshotArray.map((val, i) => (
                                                    <img className='' src={val} key={i} />
                                                ))
                                            }
                                        </div>
                                        <Button type="default" onClick={() => {
                                            setScreenshotArray([]);
                                            setSubmitLoading(false);
                                        }} className=''>Restart Verification</Button>
                                        <Button type="default" onClick={handleFormSubmission} loading={submitLoading} className=''>Submit</Button>
                                    </div>
                                ) : (
                                    <Button
                                        type="default"
                                        onClick={handleFaceVerification}
                                        loading={isPermissionModalVisible || isWebcamModalVisible}
                                    >
                                        Start Facial Verification
                                    </Button>
                                )
                            }
                        </Form>
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
                        title={`Face Verification`}
                        open={isWebcamModalVisible}
                        onOk={capture}
                        okText={`Capture ${captureCount + 1}`}
                        onCancel={() => {
                            stopWebcam();
                            setScreenshotArray([]);
                        }}
                    >
                        <Webcam
                            key={webcamKey}
                            audio={false}
                            className='rounded-xl'
                            height={720}
                            ref={webcamRef}
                            screenshotFormat="image/png"
                            screenshotQuality={5}
                            width={1280}
                            mirrored
                        />
                    </Modal>

                    {/* Alert Modal */}
                    <Modal
                        title={alertModalContent.title}
                        open={isAlertModalVisible}
                        onCancel={() => setIsAlertModalVisible(false)}
                        footer={[
                            <Button key="submit" type="default" onClick={() => setIsAlertModalVisible(false)}>
                                OK
                            </Button>,
                            alertModalContent.title === 'Success' && (
                                <Button key="login" type="default" onClick={() => window.location.href = '/login'}>
                                    Go to Login
                                </Button>
                            )
                        ]}
                    >
                        <p>{alertModalContent.message}</p>
                    </Modal>
                </div>
            </Content>
        </>
    )
}

export default FaceVerify