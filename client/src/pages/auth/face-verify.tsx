import { Button, DatePicker, Divider, Form, Input, Modal, Select, notification } from 'antd';
import { Content } from 'antd/es/layout/layout';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { MacCommandFilled } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { aau_faculties } from '../maps';
const { Option } = Select;
const { RangePicker } = DatePicker;

function formatDate(isoDateString: string) {
    const date = new Date(isoDateString);

    let day = date.getDate().toString();
    let month = (date.getMonth() + 1).toString(); // Months are zero-indexed
    let year = date.getFullYear().toString();

    // Pad day and month with zeros if necessary
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');

    // Return the formatted date string
    return `${day}/${month}/${year}`;
}

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
    const [api, contextHolder] = notification.useNotification();
    const [selectedFaculty, setSelectedFaculty] = useState<string>('');

    const onFacultyChange = (value: string) => {
        setSelectedFaculty(value);
    };

    const getDepartments = () => {
        if (!selectedFaculty) return [];
        const faculty = aau_faculties.find(fac => fac.name === selectedFaculty);
        return faculty ? faculty.departments : [];
    };

    const getLevels = () => {
        if (!selectedFaculty) return [];
        const faculty = aau_faculties.find(fac => fac.name === selectedFaculty);
        return faculty ? faculty.course_completion_levels : [];
    };

    const handleFormSubmission = async () => {
        setSubmitLoading(true)
        try {
            const formValues = await form.validateFields();
            // console.log(formValues)
            console.log('Form is valid! Processing submission...');

            // Construct the payload
            const payload = {
                student_id: formValues.student_id,
                matriculation_number: formValues.matriculation_number,
                firstname: formValues.firstname,
                middlename: formValues.middlename,
                lastname: formValues.lastname,
                date_of_birth: formatDate(formValues.date_of_birth),
                email: formValues.email,
                phone_number: formValues.phone_number,
                faculty: formValues.faculty,
                department: formValues.department,
                level: formValues.level,
                academic_session: `${formValues.academic_session[0].format('YYYY')}/${formValues.academic_session[1].format('YYYY')}`,
                face_encodings: screenshotArray,
            };

            // console.log(payload);

            // Send the payload to your backend
            await axios.post('http://localhost:8000/face-register', payload).then(res => {
                // console.log('Registration successful:', res);
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

                api['warning']({
                    message: 'Notice',
                    description: 'Adjust lighting around you!',
                    placement: "top",
                    duration: 3
                })
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
            {contextHolder}
            <Content className='grid items-center max-w-xl min-h-screen p-5 m-auto'>
                <div className='grid gap-2'>
                    <Link to='/' className='grid items-center justify-center gap-2'>
                        <MacCommandFilled className='mx-auto text-5xl text-blue-900' />
                        <div className='text-2xl font-bold text-transparent bg-gradient-to-br from-slate-500 to-slate-800 bg-clip-text'>Authr University</div>
                    </Link>

                    <div className='grid gap-1 p-5 border rounded-xl'>
                        <div className='text-lg font-semibold text-cyan-600'>
                            Register
                        </div>
                        <Divider className='my-3' />
                        <Form
                            form={form}
                            layout="vertical"
                            name="userForm"
                        >
                            <Form.Item label='Student ID' name="student_id" rules={[{ required: true, message: 'Please input your student ID.' }]}>
                                <Input placeholder="E.g E1187055" />
                            </Form.Item>
                            <Form.Item label='Matriculation Number' name="matriculation_number" rules={[{ required: true, message: 'Please input your matriculation number in caps.' }]}>
                                <Input placeholder="E.g FPS/CSC/20/21426" />
                            </Form.Item>

                            <Form.Item label='First Name' name="firstname" rules={[{ required: true, message: 'Please input your first name' }]}>
                                <Input placeholder="E.g Bassey" />
                            </Form.Item>

                            <Form.Item label='Middle Name' name="middlename" rules={[{ required: true, message: 'Please input your middle name' }]}>
                                <Input placeholder="E.g Bright" />
                            </Form.Item>

                            <Form.Item label='Last Name' name="lastname" rules={[{ required: true, message: 'Please input your lastname' }]}>
                                <Input placeholder="E.g Olaniyi" />
                            </Form.Item>

                            <Form.Item label='Date Of Birth' name="date_of_birth" rules={[{ required: true, message: 'Please input your date of birth.' }]}>
                                <DatePicker format="DD/MM/YYYY" placeholder="E.g 20/10/2002" className='w-full' />
                            </Form.Item>

                            <Form.Item label='Email' name="email" rules={[{ required: true, message: 'Please input your email in lowercase.' }]}>
                                <Input type='email' placeholder="E.g olaniyibright@gmail.com" />
                            </Form.Item>

                            <Form.Item label='Phone Number' name="phone_number" rules={[{ required: true, message: 'Please input your phone number.' }]}>
                                <Input type='tel' placeholder="E.g +234 (0) 8140356937" />
                            </Form.Item>

                            <Form.Item
                                label="Faculty"
                                name="faculty"
                                rules={[{ required: true, message: 'Please select your faculty.' }]}
                            >
                                <Select
                                    placeholder="Select your faculty"
                                    onChange={onFacultyChange}
                                    allowClear
                                >
                                    {aau_faculties.map(fac => (
                                        <Option key={fac.name} value={fac.name}>{fac.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Department"
                                name="department"
                                rules={[{ required: true, message: 'Please select your department.' }]}
                            >
                                <Select
                                    placeholder="Select your department"
                                    disabled={!selectedFaculty}
                                    allowClear
                                >
                                    {getDepartments().map(dept => (
                                        <Option key={dept} value={dept}>{dept}</Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Level Of Study"
                                name="level"
                                rules={[{ required: true, message: 'Please select your level of study.' }]}
                            >
                                <Select
                                    placeholder="Select your level"
                                    disabled={!selectedFaculty}
                                    allowClear
                                >
                                    {getLevels().map(level => (
                                        <Option key={level} value={level}>{level}</Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Academic Session"
                                name="academic_session"
                                rules={[{ required: true, message: 'Please select the start year of your academic session.' }]}
                            >
                                <RangePicker
                                    disabled={!selectedFaculty}
                                    picker="year"
                                    format="YYYY"
                                    className="w-full"
                                    allowClear
                                />
                            </Form.Item>

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