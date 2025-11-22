import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getAllCourses } from '../features/course/courseSlice'; 
import { getCategories } from '../features/categories/categorySlice';
import { getWishlist } from '../features/wishlist/wishlistSlice'; 

import HeroSection from '../components/homePage/HeroSection';
import StatsSection from '../components/homePage/StatsSection';
import CategoriesSection from '../components/homePage/CategoriesSection';
import FeaturedCourses from '../components/homePage/FeaturedCourses';
import MasterSkills from '../components/homePage/MasterSkills';
import CtaSection from '../components/homePage/CtaSection';
import BlogSection from '../components/homePage/BlogSection';

const Home = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getAllCourses());
    dispatch(getCategories());

    if (user) {
      dispatch(getWishlist());
    }
  }, [dispatch]);
  // const { latestBlogs } = useSelector(state => state.blogs);
  return (
    <div className="font-sans text-gray-800 bg-white">
      <main>
        <HeroSection />
        <StatsSection />
        <CategoriesSection />        
        <FeaturedCourses /> 
        <MasterSkills />
        <CtaSection />
        <BlogSection />
      </main>
    </div>
  );
};

export default Home;