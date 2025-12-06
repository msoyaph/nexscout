# Fix sequence button
/canAccessFeature('sequence')/,/onNavigate('pricing')/{
  s/onNavigate('pricing');/setUpgradeFeature('sequence'); setShowUpgradeModal(true);/
}

# Fix deck button  
/canAccessFeature('deck')/,/onNavigate('pricing')/{
  s/onNavigate('pricing');/setUpgradeFeature('deck'); setShowUpgradeModal(true);/
}

# Fix deepscan button
/canAccessFeature('deepscan')/,/onNavigate('pricing')/{
  s/onNavigate('pricing');/setUpgradeFeature('deepscan'); setShowUpgradeModal(true);/
}
