import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, Bot, TrendingUp, Shield, Zap } from 'lucide-react'
import { login } from '../store/slices/authSlice'
import { AppDispatch } from '../store/store'
import toast from 'react-hot-toast'

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username.trim() || !formData.password.trim()) {
      toast.error('Please enter both username and password')
      return
    }

    setIsLoading(true)
    
    // Simulate a brief loading delay for better UX
    setTimeout(() => {
      dispatch(login(formData))
      toast.success(`Welcome back, ${formData.username}!`)
      navigate('/')
      setIsLoading(false)
    }, 1000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Trading',
      description: 'Advanced algorithms for optimal trading decisions'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Analytics',
      description: 'Live market data and performance metrics'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Bank-grade security for your assets'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Execute trades in milliseconds'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left side - Branding and Features */}
        <motion.div 
          className="space-y-8 text-center lg:text-left hidden lg:block"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="space-y-4">
            <motion.div 
              className="flex items-center justify-center lg:justify-start space-x-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold gradient-text">SolBot Core V3</h1>
            </motion.div>
            
            <motion.p 
              className="text-xl text-muted-foreground max-w-md mx-auto lg:mx-0"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Professional Solana Trading Bot Dashboard
            </motion.p>
          </div>

          <motion.div 
            className="grid sm:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <feature.icon className="w-8 h-8 text-primary mb-2 mx-auto lg:mx-0" />
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right side - Login Form */}
        <motion.div
          className="w-full max-w-md mx-auto"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Mobile header */}
          <motion.div 
            className="text-center mb-8 lg:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SolBot Core V3
              </h1>
            </div>
            <p className="text-muted-foreground">Professional Solana Trading Bot Dashboard</p>
          </motion.div>

          <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl p-6 sm:p-8">
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
              <p className="text-muted-foreground">Sign in to access your trading dashboard</p>
            </motion.div>

            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-foreground placeholder-muted-foreground"
                    placeholder="Enter your username"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-foreground placeholder-muted-foreground"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </motion.button>
            </motion.form>

            <motion.div 
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-sm text-muted-foreground">
                Demo Mode: Any username and password will work
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Login