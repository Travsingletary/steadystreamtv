
import React from 'react';

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "SteadyStream Customer",
    content: "The setup was incredibly easy! I had everything running on my Fire TV in under 5 minutes. The channel quality is amazing.",
    rating: 5
  },
  {
    name: "Mike Rodriguez", 
    role: "Long-time User",
    content: "Best IPTV service I've used. Reliable streams, great customer support, and the price can't be beaten.",
    rating: 5
  },
  {
    name: "Emma Thompson",
    role: "Family Plan User", 
    content: "Perfect for our family. Multiple devices, great kids content, and we're saving hundreds compared to cable.",
    rating: 5
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 bg-dark-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our <span className="text-gradient-gold">Customers</span> Say
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have made the switch to SteadyStream TV
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => {
  return (
    <div className="bg-dark-200 rounded-xl p-6 border border-gray-800 hover:border-gold/30 transition-all duration-300">
      <div className="flex mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <span key={i} className="text-gold text-xl">★</span>
        ))}
      </div>
      
      <p className="text-gray-300 mb-6 italic">
        "{testimonial.content}"
      </p>
      
      <div className="flex items-center">
        <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center mr-4">
          <span className="text-black font-bold text-lg">
            {testimonial.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <h4 className="font-semibold text-white">{testimonial.name}</h4>
          <p className="text-gray-400 text-sm">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;
