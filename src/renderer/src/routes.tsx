import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ModelingData from './pages/ModelingData'
import SimulatingForecast from './pages/SimulatingForecast'
import RecommendParameter from './pages/RecommendParameter'
import LoginPage from './pages/Login'
import BasicLayout from './pages/layout'

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<BasicLayout />}>
        <Route path="home" element={<Home />} />
        <Route path="modelingData" element={<ModelingData />} />
        <Route path="simulatingForecast" element={<SimulatingForecast />} />
        <Route path="recommendParameter" element={<RecommendParameter />} />

      </Route>
    </Routes>
  )
}

export default AppRoutes
