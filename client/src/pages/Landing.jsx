import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';

const requireEduEmail = import.meta.env.VITE_REQUIRE_EDU_EMAIL !== 'false';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-gradient-dark opacity-20" />
        <div className="mx-auto max-w-2xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold tracking-tight text-white sm:text-6xl"
          >
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-primary">RotateStay</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-lg leading-8 text-gray-300"
          >
            The trusted platform for medical students to swap or rent housing during clinical rotations.
            Connect with verified med students nationwide.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex items-center justify-center gap-x-6"
          >
            <Link
              to="/register"
              className="rounded-full bg-gradient-primary px-8 py-3 text-sm font-semibold text-white shadow-lg transition duration-200 hover:scale-105 hover:shadow-xl"
            >
              Get Started
            </Link>
            <Link
              to="/listings"
              className="rounded-full border border-primary-500 px-8 py-3 text-sm font-semibold text-primary-400 transition duration-200 hover:bg-primary-500/10"
            >
              Browse Listings
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Why Choose RotateStay?
            </h2>
            <p className="mt-4 text-lg text-gray-400">Built by medical students, for medical students</p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="mb-4 rounded-2xl bg-gradient-primary p-3 shadow-lg">
                    <feature.icon className="h-8 w-8 text-white" aria-hidden="true" />
                  </div>
                  <dt className="text-lg font-semibold leading-7 text-white">{feature.name}</dt>
                  <dd className="mt-1 text-sm leading-7 text-gray-400">{feature.description}</dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-dark-800/50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">How It Works</h2>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-y-12 gap-x-8 lg:grid-cols-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative rounded-2xl bg-dark-700 p-8 shadow-xl transition-shadow duration-300 hover:shadow-2xl"
                >
                  <div className="absolute -top-4 -left-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-lg font-bold text-white">
                    {index + 1}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-gray-400">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const features = [
  {
    name: requireEduEmail ? 'Verified Students Only' : 'Built for Med Students',
    description: requireEduEmail
      ? 'All users verified with .edu emails and school IDs for maximum security.'
      : 'Academic verification is optional in this environment so you can explore RotateStay instantly.',
    icon: ShieldCheckIcon
  },
  {
    name: 'Swap or Rent',
    description: 'Exchange apartments with students at your rotation site or rent when needed.',
    icon: HomeIcon
  },
  {
    name: 'Built-in Messaging',
    description: 'Communicate directly with hosts and guests through our secure platform.',
    icon: ChatBubbleBottomCenterTextIcon
  },
  {
    name: 'Trusted Community',
    description: 'Read reviews from fellow medical students to make informed decisions.',
    icon: UserGroupIcon
  }
];

const steps = [
  {
    title: 'Sign Up & Verify',
    description: requireEduEmail
      ? 'Create your account with your .edu email and upload your school ID for verification.'
      : 'Create your account in seconds using any email while you try out RotateStay.'
  },
  {
    title: 'List or Search',
    description: 'Post your space or search for housing near your rotation hospital.'
  },
  {
    title: 'Connect & Book',
    description: 'Message hosts, get approved, and secure your rotation housing.'
  }
];

export default Landing;
