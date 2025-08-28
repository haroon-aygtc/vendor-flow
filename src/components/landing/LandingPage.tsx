"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Play, 
  CheckCircle, 
  Star, 
  Menu, 
  X, 
  Zap, 
  Brain, 
  Workflow, 
  Shield, 
  BarChart3, 
  Users, 
  Clock, 
  Globe,
  ChevronDown,
  Quote,
  Calendar,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI Agent Orchestration",
      description: "Deploy and manage multiple AI agents with intelligent task distribution and real-time coordination."
    },
    {
      icon: <Workflow className="h-8 w-8" />,
      title: "Visual Workflow Builder",
      description: "Create complex AI workflows with our intuitive drag-and-drop interface. No coding required."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Multi-Provider Integration",
      description: "Connect OpenAI, Anthropic, Google AI, and more. Switch providers seamlessly for optimal performance."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Enterprise Security",
      description: "Bank-grade security with end-to-end encryption, audit logs, and compliance certifications."
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Real-time Analytics",
      description: "Monitor performance, track costs, and optimize workflows with comprehensive analytics dashboard."
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Smart Vendor Selection",
      description: "Automated vendor selection system that chooses the best AI provider based on task requirements and cost."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CTO at TechFlow Inc",
      company: "TechFlow Inc",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      content: "AxonStreamAI transformed our AI operations. We reduced processing time by 60% and cut costs by 40% with their smart vendor selection system.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Head of AI at DataCorp",
      company: "DataCorp",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
      content: "The workflow builder is incredible. Our team can now create complex AI pipelines without any coding. It's a game-changer for productivity.",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "VP Engineering at InnovateLab",
      company: "InnovateLab",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
      content: "Best AI orchestration platform we've used. The real-time monitoring and analytics give us complete visibility into our AI operations.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$49",
      period: "/month",
      description: "Perfect for small teams getting started with AI automation",
      features: [
        "Up to 5 AI agents",
        "10,000 API calls/month",
        "Basic workflow builder",
        "Email support",
        "Standard integrations"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$149",
      period: "/month",
      description: "Ideal for growing businesses with advanced AI needs",
      features: [
        "Up to 25 AI agents",
        "100,000 API calls/month",
        "Advanced workflow builder",
        "Priority support",
        "All integrations",
        "Real-time analytics",
        "Custom workflows"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "Tailored solutions for large organizations",
      features: [
        "Unlimited AI agents",
        "Unlimited API calls",
        "White-label solution",
        "24/7 dedicated support",
        "Custom integrations",
        "Advanced security",
        "SLA guarantee"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AxonStreamAI
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Features</a>
              <a href="#solutions" className="text-gray-700 hover:text-blue-600 transition-colors">Solutions</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Testimonials</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className="block px-3 py-2 text-gray-700 hover:text-blue-600">Features</a>
              <a href="#solutions" className="block px-3 py-2 text-gray-700 hover:text-blue-600">Solutions</a>
              <a href="#pricing" className="block px-3 py-2 text-gray-700 hover:text-blue-600">Pricing</a>
              <a href="#testimonials" className="block px-3 py-2 text-gray-700 hover:text-blue-600">Testimonials</a>
              <a href="#contact" className="block px-3 py-2 text-gray-700 hover:text-blue-600">Contact</a>
              <div className="pt-4 pb-2 border-t">
                <Link href="/auth/login" className="block px-3 py-2">
                  <Button variant="ghost" className="w-full justify-start">Sign In</Button>
                </Link>
                <Link href="/auth/register" className="block px-3 py-2">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">Get Started Free</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  🚀 Now in Public Beta
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                  The Future of{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI Orchestration
                  </span>{' '}
                  is Here
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Build, deploy, and scale AI workflows with unprecedented ease. 
                  AxonStreamAI connects multiple AI providers, automates vendor selection, 
                  and delivers enterprise-grade performance.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  14-day free trial
                </div>
              </div>
            </div>

            {/* Hero Image/Demo */}
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">AI Workflow Dashboard</h3>
                    <Badge className="bg-green-100 text-green-800">Live</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <Brain className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-sm font-medium">12 Agents</div>
                      <div className="text-xs text-gray-500">Active</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <Workflow className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-medium">8 Workflows</div>
                      <div className="text-xs text-gray-500">Running</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <BarChart3 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-sm font-medium">99.9%</div>
                      <div className="text-xs text-gray-500">Uptime</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-pink-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern AI Teams
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to build, deploy, and scale AI workflows with confidence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-0 shadow-md">
                <CardContent className="p-0">
                  <div className="text-blue-600 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes AxonStream Special */}
      <section id="solutions" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Makes AxonStreamAI Special
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced capabilities that set us apart from traditional AI platforms
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Intelligent Vendor Selection</h3>
                    <p className="text-gray-600">Our proprietary algorithm automatically selects the best AI provider based on task complexity, cost, and performance requirements.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Optimization</h3>
                    <p className="text-gray-600">Continuously monitors and optimizes workflows for maximum efficiency, automatically switching providers when needed.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Collaborative Workflows</h3>
                    <p className="text-gray-600">Enable multiple AI agents to work together seamlessly, sharing context and coordinating complex multi-step processes.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-1">
                <div className="bg-white rounded-xl p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">Smart Vendor Selection</h4>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium">OpenAI GPT-4</span>
                        <span className="text-xs text-blue-600">Selected</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Anthropic Claude</span>
                        <span className="text-xs text-gray-500">Standby</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Google Gemini</span>
                        <span className="text-xs text-gray-500">Available</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cost Optimization</span>
                        <span className="font-medium text-green-600">-40%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying about AxonStreamAI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-gray-300 mb-4" />
                  <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-sm text-gray-500">{testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs. Upgrade or downgrade at any time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`p-8 relative ${plan.popular ? 'ring-2 ring-blue-600 shadow-xl' : 'shadow-md'}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-0">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                    <p className="text-gray-600">{plan.description}</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full ${plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                      : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                  >
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay Updated with AxonStreamAI
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get the latest updates on new features, AI trends, and best practices
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white/50"
            />
            <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Contact/Book Demo */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Ready to Transform Your AI Operations?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Book a personalized demo and see how AxonStreamAI can revolutionize your AI workflows.
              </p>

              <div className="space-y-6">
                <div className="flex items-center">
                  <Calendar className="h-6 w-6 text-blue-600 mr-4" />
                  <span className="text-gray-700">30-minute personalized demo</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-blue-600 mr-4" />
                  <span className="text-gray-700">Custom solution consultation</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-6 w-6 text-blue-600 mr-4" />
                  <span className="text-gray-700">Security & compliance review</span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600">hello@axonstreamai.com</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600">San Francisco, CA</span>
                  </div>
                </div>
              </div>
            </div>

            <Card className="p-8 shadow-xl">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Book Your Demo</h3>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your Company"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>1-10 employees</option>
                      <option>11-50 employees</option>
                      <option>51-200 employees</option>
                      <option>201-1000 employees</option>
                      <option>1000+ employees</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tell us about your AI needs</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe your current AI challenges and goals..."
                    />
                  </div>

                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3">
                    Book Demo Now
                    <Calendar className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">AxonStreamAI</span>
              </div>
              <p className="text-gray-400 mb-6">
                The future of AI orchestration. Build, deploy, and scale AI workflows with unprecedented ease.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 cursor-pointer">
                  <span className="text-sm">𝕏</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 cursor-pointer">
                  <span className="text-sm">in</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 cursor-pointer">
                  <span className="text-sm">gh</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 AxonStreamAI. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;