import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorService from '../services/ErrorService';

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

 