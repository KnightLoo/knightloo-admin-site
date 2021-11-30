import React from 'react'
import { Formik, Field, Form, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import {auth} from '../firebaseApp';
import { signInWithEmailAndPassword } from "firebase/auth";

 const SignupSchema = Yup.object().shape({
   password: Yup.string().required('Required'),
   email: Yup.string()
             .email('Invalid email')
             .required('Required')
             
 });


export default function SignInForm({setIsLoading, setAdminLoginError, adminLoginError}) {

    const handleLogin = async ({email, password}) => {

        if(email && password){
            console.log("here");
            setIsLoading(true);
            try {
                await signInWithEmailAndPassword(auth, email, password);

            } catch (error){
                console.log("Error: ", error);
                setIsLoading(false);
            }

        }   
    }


    return (
      <div className='login_box p-3'>
        <h1 className="display-6 mb-3">Login</h1>
        <Formik
          initialValues={{email: '', password: ''}}
          validationSchema={SignupSchema}
          handleChange={() => {
              if(adminLoginError){
                  console.log("changing it");
                setAdminLoginError(null);
              }
          }}
          onSubmit={async (values, { setSubmitting }) => {
              setSubmitting(true);
              await handleLogin(values);
              setSubmitting(false);
              console.log("here2");
          }}
        >
            {({ errors, touched }) => (
          <Form >
              
            <div className="mb-3">
              <Field className="form-control" id="email" name="email" placeholder="Email"/>
              {errors.email && touched.email ? (
                <div className="field-error-text">{errors.email}</div>) : null}
               {!errors.email && !errors.password && adminLoginError && touched.email ? (<div className="field-error-text">{adminLoginError}</div>) :  null }
            </div>
            
  
            <div className="mb-3">
              <Field className="form-control" id="password" name="password" placeholder="Password" type="password" />
              {errors.password && touched.password ? (
                <div className="field-error-text">{errors.password}</div>) : null}
            </div>
            

            <button type="submit" className="btn btn-primary login-btn">Login</button>
          </Form>
           )}
        </Formik>
      </div>
    );
  };