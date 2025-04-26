const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Kullanıcının abonelik durumunu getir
exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });
    if (!subscription) {
      return res.status(404).json({ msg: 'Subscription not found' });
    }

    // Abonelik durumunu güncelle
    subscription.status = subscription.checkStatus();
    await subscription.save();

    // Hassas bilgileri çıkar
    const subscriptionData = subscription.toObject();
    delete subscriptionData.cardLastFour;

    res.json(subscriptionData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Yeni abonelik oluştur
exports.createSubscription = async (req, res) => {
  try {
    const { plan, autoRenew, cardLastFour } = req.body;

    // Kullanıcının mevcut aboneliğini kontrol et
    const existingSubscription = await Subscription.findOne({ user: req.user.id });
    if (existingSubscription && existingSubscription.status === 'active') {
      return res.status(400).json({ msg: 'User already has an active subscription' });
    }

    // Yeni abonelik oluştur
    const subscription = new Subscription({
      user: req.user.id,
      plan,
      paymentMethod: 'credit_card',
      autoRenew,
      cardLastFour,
      features: Subscription.getPlanFeatures(plan)
    });

    // Bitiş tarihini hesapla
    subscription.endDate = subscription.calculateEndDate();
    subscription.nextPaymentDate = subscription.endDate;

    await subscription.save();

    // Kullanıcının plan bilgisini güncelle
    await User.findByIdAndUpdate(req.user.id, { plan });

    // Hassas bilgileri çıkar
    const subscriptionData = subscription.toObject();
    delete subscriptionData.cardLastFour;

    res.json(subscriptionData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Abonelik planını güncelle
exports.updateSubscription = async (req, res) => {
  try {
    const { plan, autoRenew, cardLastFour } = req.body;

    const subscription = await Subscription.findOne({ user: req.user.id });
    if (!subscription) {
      return res.status(404).json({ msg: 'Subscription not found' });
    }

    // Plan değişikliği varsa özellikleri güncelle
    if (plan && plan !== subscription.plan) {
      subscription.plan = plan;
      subscription.features = Subscription.getPlanFeatures(plan);
      subscription.endDate = subscription.calculateEndDate();
      subscription.nextPaymentDate = subscription.endDate;
    }

    if (autoRenew !== undefined) subscription.autoRenew = autoRenew;
    if (cardLastFour) subscription.cardLastFour = cardLastFour;

    await subscription.save();

    // Kullanıcının plan bilgisini güncelle
    if (plan) {
      await User.findByIdAndUpdate(req.user.id, { plan });
    }

    // Hassas bilgileri çıkar
    const subscriptionData = subscription.toObject();
    delete subscriptionData.cardLastFour;

    res.json(subscriptionData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Aboneliği iptal et
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });
    if (!subscription) {
      return res.status(404).json({ msg: 'Subscription not found' });
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    // Kullanıcının planını free'e düşür
    await User.findByIdAndUpdate(req.user.id, { plan: 'free' });

    res.json({ msg: 'Subscription cancelled successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Tüm planları getir
exports.getPlans = async (req, res) => {
  try {
    const plans = {
      free: {
        name: 'Free',
        price: 0,
        features: Subscription.getPlanFeatures('free'),
        duration: 'Unlimited'
      },
      basic: {
        name: 'Basic',
        price: 9.99,
        features: Subscription.getPlanFeatures('basic'),
        duration: 'Monthly'
      },
      premium: {
        name: 'Premium',
        price: 19.99,
        features: Subscription.getPlanFeatures('premium'),
        duration: 'Monthly'
      },
      enterprise: {
        name: 'Enterprise',
        price: 99.99,
        features: Subscription.getPlanFeatures('enterprise'),
        duration: 'Yearly'
      }
    };

    res.json(plans);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}; 