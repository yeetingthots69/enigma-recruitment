import React, {useState} from 'react';
import {
    Box,
    Container,
    Typography,
    CardContent,
    Card,
    styled
} from '@mui/material';

const features = [
    {
        icon: "https://cdn.builder.io/api/v1/image/assets/TEMP/bf891ef41bca0e8aba070376107c9b9db8862d19?placeholderIfAbsent=true&apiKey=8ef08a3c60b44d4ba008c3e63d84c943",
        title: "General and Factory Management",
        description: "We recruit factory leaders who manage end-to-end plant operations, drive business strategy, and lead large production teams."
    },
    {
        icon: "https://cdn.builder.io/api/v1/image/assets/TEMP/89b601568bae0fd13231273135b9081303f00664?placeholderIfAbsent=true&apiKey=8ef08a3c60b44d4ba008c3e63d84c943",
        title: "Production and Operations Engineering",
        description: "We place engineers and supervisors who optimize production lines, ensure workflow efficiency, and maintain high operational output."
    },
    {
        icon: "https://cdn.builder.io/api/v1/image/assets/TEMP/31e4bef2170abf0a82544112e1395e0ad77b2ba1?placeholderIfAbsent=true&apiKey=8ef08a3c60b44d4ba008c3e63d84c943",
        title: "Continuous Improvement and Maintenance",
        description: "We source CI experts and technicians to drive lean practices, improve processes, and handle equipment maintenance proactively."
    },
    {
        icon: "/12345.png",
        title: "Supply Chain and Logistics",
        description: "Our talent pool includes professionals skilled in procurement, warehousing, distribution, and global logistics coordination."
    },
    {
        icon: "https://cdn.builder.io/api/v1/image/assets/TEMP/11293236a2c6abb2cb6a80e7dee3249cd2c13036?placeholderIfAbsent=true&apiKey=8ef08a3c60b44d4ba008c3e63d84c943",
        title: "Finance and Accounting",
        description: "We help businesses find finance experts who oversee financial reporting, cost control, budgeting, and regulatory compliance."
    },
    {
        icon: "https://cdn.builder.io/api/v1/image/assets/TEMP/512fadec40729828eb17f1b11e110eea67ddc3b8?placeholderIfAbsent=true&apiKey=8ef08a3c60b44d4ba008c3e63d84c943",
        title: "Purchasing and Planning",
        description: "We recruit planners and buyers who forecast demand, manage suppliers, and streamline procurement workflows for efficiency."
    },
    {
        icon: "https://cdn.builder.io/api/v1/image/assets/TEMP/05c217cfea2deb76f5f046da59de481124171f7f?placeholderIfAbsent=true&apiKey=8ef08a3c60b44d4ba008c3e63d84c943",
        title: "HR & Administration",
        description: "We connect HR professionals who shape culture, manage talent, and ensure legal compliance."
    }
];

const FeatureCard = styled(Card)({
    boxShadow: 'none',
    textAlign: 'center',
    width: '100%',
    transition: 'margin 0.3s ease', // Smooth transition for margin changes
});

const DescriptionBox = styled(Box)(({theme}) => ({
    color: '#404A7C',
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing(1),
    transition: 'opacity 0.3s ease, transform 0.3s ease, max-height 0.3s ease',
    maxWidth: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
    opacity: 0,
    maxHeight: 0,
    overflow: 'hidden',
    transform: 'scale(0.8)',
    '&.visible': {
        opacity: 1,
        maxHeight: '100px', // Adjust based on content height
        transform: 'scale(1)',
    },
}));

const SpecializedFunctions: React.FC = () => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    return (
        <Box sx={{py: 10, bgcolor: 'background.default'}}>
            <Container maxWidth="lg">
                <Box sx={{textAlign: 'center', mb: 7}}>
                    <Typography variant="h2" gutterBottom sx={{
                        color: '#101828',

                    }}>
                        Functions We Specialize In
                    </Typography>
                    <Typography
                        sx={{
                            color: 'text.secondary',
                            fontSize: '20px',
                            lineHeight: '30px',
                            mx: 'auto',
                        }}
                    >
                        Our shared values keep us connected and guide us as one team.
                    </Typography>
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                        justifyContent: 'center',
                    }}
                >
                    {features.map((feature, index) => (
                        <Box
                            key={index}
                            sx={{
                                flex: '1 1 calc(33.333% - 16px)',
                                maxWidth: 'calc(33.333% - 16px)',
                                minWidth: {xs: '250px', md: '200px'},
                                transition: 'gap 0.3s ease',
                                marginBottom: hoveredIndex === index ? '48px' : '0px', // Increase margin-bottom on hover
                            }}
                        >
                            <FeatureCard
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                <CardContent>
                                    <Box
                                        component="img"
                                        src={feature.icon}
                                        sx={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.6)',
                                            border: '1px solid rgba(255, 255, 255, 0.8)',
                                            width: 48,
                                            height: 48,
                                            mb: 2,
                                            cursor: 'pointer',
                                        }}
                                    />
                                    <Typography
                                        variant="h5"
                                        sx={{cursor: 'pointer'}}
                                    >
                                        {feature.title}
                                    </Typography>
                                    <DescriptionBox
                                        className={hoveredIndex === index ? 'visible' : ''}
                                    >
                                        <Typography variant="body1">
                                            {feature.description}
                                        </Typography>
                                    </DescriptionBox>
                                </CardContent>
                            </FeatureCard>
                        </Box>
                    ))
                    }
                </Box>
            </Container>
        </Box>
    );
};

export default SpecializedFunctions;